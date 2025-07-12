import 'leaflet/dist/leaflet.css';
import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLngTuple, Marker as LeafletMarker } from 'leaflet';

interface MapSelectorProps {
  lat: string;
  long: string;
  onLatLongChange?: (lat: string, long: string) => void; // for live updates
}

const MapSelector: React.FC<MapSelectorProps> = ({ lat, long, onLatLongChange }) => {
  const markerRef = useRef<LeafletMarker>(null);
  const [position, setPosition] = useState<LatLngTuple>(lat && long ? [parseFloat(lat), parseFloat(long)] : [0, 0]);

  // Update position if props change (e.g., manual entry)
  useEffect(() => {
    if (
      lat && long &&
      (!isNaN(parseFloat(lat))) &&
      (!isNaN(parseFloat(long))) &&
      (parseFloat(lat) !== position[0] || parseFloat(long) !== position[1])
    ) {
      setPosition([parseFloat(lat), parseFloat(long)]);
    }
  }, [lat, long, position]);

  // Map click handler
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        if (onLatLongChange) onLatLongChange(e.latlng.lat.toString(), e.latlng.lng.toString());
      },
    });
    return (
      <Marker
        position={position as LatLngTuple}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            setPosition([pos.lat, pos.lng]);
            if (onLatLongChange) onLatLongChange(pos.lat.toString(), pos.lng.toString());
          },
        }}
        ref={markerRef}
      />
    );
  }

  return (
    <div style={{ height: 440, width: 640, borderRadius: 8, overflow: 'hidden', margin: '8px 0' }}>
      <MapContainer center={position as LatLngTuple} zoom={position[0] === 0 && position[1] === 0 ? 2 : 12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default MapSelector;
