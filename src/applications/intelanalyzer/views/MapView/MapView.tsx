import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import maplibregl, { Map as MLMap, LngLatLike, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { useFilter } from '../../state/FilterContext';
import { useCorrelation } from '../../state/CorrelationContext';
import { useSelection } from '../../state/SelectionContext';
import { useIntelWorkspace } from '../../../../services/intel/IntelWorkspaceContext';
import { adaptWorkspaceToEvents } from '../../adapters/eventsAdapter';

type PointFeature = GeoJSON.Feature<GeoJSON.Point, { id: string; category?: string; }>

const pointFeature = (id: string, lon: number, lat: number, category?: string): PointFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties: { id, category }
});

const MapView: React.FC = () => {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const { reports, intelItems } = useIntelWorkspace();
  const { filters, updateFilter } = useFilter();
  const { setSelectedItem, selectedItem } = useSelection();
  const { showClusters, placeClusters } = useCorrelation();

  const events = useMemo(() => adaptWorkspaceToEvents(reports, intelItems), [reports, intelItems]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // timeRange
      if (filters.timeRange) {
        const t = new Date(ev.timestamp).getTime();
        const s = filters.timeRange.start.getTime();
        const e = filters.timeRange.end.getTime();
        if (t < s || t > e) return false;
      }
      // entityRefs
      if (filters.entityRefs && filters.entityRefs.length > 0) {
        if (!ev.entityRefs || !ev.entityRefs.some(id => filters.entityRefs!.includes(id))) return false;
      }
      // categories
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(ev.category)) return false;
      }
      // geo polygon containment (simple point-in-polygon, ray-casting)
      if (filters.geo?.polygon && ev.lat != null && ev.lon != null) {
        const poly = filters.geo.polygon;
        const x = ev.lon, y = ev.lat;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i][0], yi = poly[i][1];
          const xj = poly[j][0], yj = poly[j][1];
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
          if (intersect) inside = !inside;
        }
        if (!inside) return false;
      }
      return true;
    });
  }, [events, filters]);

  const clusterIndex = useMemo(() => {
    const features: PointFeature[] = filteredEvents
      .filter(e => e.lat != null && e.lon != null)
      .map(e => pointFeature(e.id, e.lon!, e.lat!, e.category));
    const idx = new Supercluster<{ id: string; category?: string }, { point_count: number }>({ radius: 60, maxZoom: 16 });
    idx.load(features);
    return idx;
  }, [filteredEvents]);

  // Map init
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 20] as LngLatLike,
      zoom: 1.5,
      attributionControl: false
    });
    mapRef.current = map;
    map.on('load', () => {
      // Add empty sources
      map.addSource('points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'clusters', type: 'circle', source: 'points', filter: ['has', 'point_count'], paint: {
        'circle-color': '#00bfff', 'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 1, 10, 100, 20], 'circle-opacity': 0.6
      }});
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'points', filter: ['has', 'point_count'], layout: {
        'text-field': ['to-string', ['get', 'point_count']], 'text-size': 12
      }, paint: { 'text-color': '#ffffff' }});
      map.addLayer({ id: 'unclustered', type: 'circle', source: 'points', filter: ['!', ['has', 'point_count']], paint: {
        'circle-color': '#00ff41', 'circle-radius': 5, 'circle-opacity': 0.8, 'circle-stroke-width': 1, 'circle-stroke-color': '#0a0'
      }});

      // Selection halo
      map.addSource('selection', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'selection-halo', type: 'circle', source: 'selection', paint: {
        'circle-color': '#00ff41', 'circle-radius': 7, 'circle-opacity': 0.2, 'circle-stroke-width': 2, 'circle-stroke-color': '#00ff41'
      }});

      // Polygon draw
      map.addSource('draw-poly', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'draw-poly-fill', type: 'fill', source: 'draw-poly', paint: { 'fill-color': '#00bfff', 'fill-opacity': 0.15 } });
      map.addLayer({ id: 'draw-poly-line', type: 'line', source: 'draw-poly', paint: { 'line-color': '#00bfff', 'line-width': 2 } });

      // Place clusters overlay (empty initially)
      map.addSource('place-clusters', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'place-clusters-layer',
        type: 'circle',
        source: 'place-clusters',
        paint: {
          'circle-color': '#ffaa00',
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'count'],
            3, 8,
            10, 14,
            50, 22
          ],
          'circle-opacity': 0.35,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffaa00'
        }
      });

      setReady(true);
    });

    return () => map.remove();
  }, []);

  // Update clusters on view changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const source = map.getSource('points') as GeoJSONSource | undefined;
    if (!source) return;
    const bounds = map.getBounds();
    const z = Math.round(map.getZoom());
  const tiles = clusterIndex.getClusters([
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()
  ], z) as Array<GeoJSON.Feature<GeoJSON.Point>>;
  source.setData({ type: 'FeatureCollection', features: tiles });
  }, [clusterIndex, ready]);

  // Update place clusters overlay whenever correlation changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const src = map.getSource('place-clusters') as GeoJSONSource | undefined;
    if (!src) return;
    const features: GeoJSON.Feature<GeoJSON.Point, { count: number }>[] =
      showClusters
        ? placeClusters.map(pc => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [pc.center[0], pc.center[1]] },
            properties: { count: pc.count }
          }))
        : [];
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    src.setData(fc);
  }, [showClusters, placeClusters, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const update = () => {
      const source = map.getSource('points') as GeoJSONSource | undefined;
      if (!source) return;
      const bounds = map.getBounds();
      const z = Math.round(map.getZoom());
  const tiles = clusterIndex.getClusters([
        bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()
  ], z) as Array<GeoJSON.Feature<GeoJSON.Point>>;
  source.setData({ type: 'FeatureCollection', features: tiles });
    };
    update();
    map.on('moveend', update);
    return () => { map.off('moveend', update); };
  }, [ready, clusterIndex]);

  // Click handlers for selection and clusters
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered'] });
      if (features.length > 0) {
        const f = features[0] as GeoJSON.Feature<GeoJSON.Point, { id?: string }> & { properties?: { id?: string } };
        const id = f?.properties?.id;
        if (id) {
          const ev = filteredEvents.find(ev => ev.id === id);
          if (ev) setSelectedItem({ id: ev.id, type: 'event', data: ev });
        }
      }
    };
    map.on('click', 'unclustered', onClick);
    return () => { map.off('click', 'unclustered', onClick); };
  }, [ready, filteredEvents, setSelectedItem]);

  // Selection halo update
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const selSource = map.getSource('selection') as GeoJSONSource | undefined;
    if (!selSource) return;
  if (selectedItem?.type === 'event') {
      const ev = filteredEvents.find(e => e.id === selectedItem.id);
      if (ev && ev.lat != null && ev.lon != null) {
    selSource.setData({ type: 'FeatureCollection', features: [pointFeature(ev.id, ev.lon!, ev.lat!)] });
        return;
      }
    }
    selSource.setData({ type: 'FeatureCollection', features: [] });
  }, [ready, selectedItem, filteredEvents]);

  // Simple polygon draw state
  const [drawing, setDrawing] = useState(false);
  const [poly, setPoly] = useState<[number, number][]>([]); // [lon, lat]

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const src = map.getSource('draw-poly') as GeoJSONSource | undefined;
    if (!src) return;
    const coords = poly.length > 2 ? [...poly, poly[0]] : poly;
    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: coords.length >= 3 ? [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {}
      } as GeoJSON.Feature] : []
    };
    src.setData(data);
  }, [poly, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const handler = (e: maplibregl.MapMouseEvent) => {
      if (!drawing) return;
      const lngLat = e.lngLat;
      setPoly(prev => [...prev, [lngLat.lng, lngLat.lat]]);
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [drawing, ready]);

  const completePolygon = () => {
    if (poly.length >= 3) {
      updateFilter('geo', { polygon: poly });
    }
    setDrawing(false);
  };

  const clearPolygon = () => {
    setPoly([]);
    updateFilter('geo', undefined);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ p: 1 }}>
        <Typography variant="body2">MapView</Typography>
        <Button size="small" variant={drawing ? 'contained' : 'outlined'} onClick={() => setDrawing(d => !d)}>
          {drawing ? 'Drawing…' : 'Draw polygon'}
        </Button>
        <Button size="small" onClick={completePolygon} disabled={!drawing || poly.length < 3}>Complete</Button>
        <Button size="small" onClick={clearPolygon} disabled={poly.length === 0}>Clear</Button>
      </Stack>
      {showClusters && (
        <Typography variant="caption" sx={{ px: 1 }} data-testid="place-clusters-count">
          Place clusters: {placeClusters.length}
        </Typography>
      )}
      <Box ref={containerRef} sx={{ flex: 1, minHeight: 300 }} />
    </Box>
  );
};

export default MapView;
