import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, CircleMarkerProps } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEIAData } from '../../../hooks/useEIAData';

interface EnergyMapProps {
  endpoint: string;
  params?: Record<string, string>;
}

interface MapDataPoint {
  lat: number;
  lon: number;
  value: number;
  period: string;
}

const EnergyMap: React.FC<EnergyMapProps> = ({ endpoint, params = {} }) => {
  const { data, loading, error } = useEIAData(endpoint, params);
  const [mapData, setMapData] = useState<MapDataPoint[]>([]);

  useEffect(() => {
    if (data) {
      setMapData(
        data.map((point) => ({
          lat: parseFloat(point.latitude),
          lon: parseFloat(point.longitude),
          value: parseFloat(point.value),
          period: point.period,
        }))
      );
    }
  }, [data]);

  const center: LatLngExpression = [20, 0];

  return (
    <div className="w-full h-96 bg-gray-800 text-white border border-gray-600 rounded-lg overflow-hidden">
      <h3 className="text-lg font-bold p-2">Global Energy Production & Consumption</h3>
      {loading ? (
        <p className="text-gray-400 text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-400 text-center">Error fetching data</p>
      ) : (
        <MapContainer center={center} zoom={2} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {mapData.map((location, index) => {
            const markerProps: CircleMarkerProps = {
              center: [location.lat, location.lon],
              radius: 5,
              color: "rgba(75, 192, 192, 1)",
              fillColor: "rgba(75, 192, 192, 0.5)",
              fillOpacity: 0.8,
            };
            return (
              <CircleMarker key={index} {...markerProps}>
                <Popup>
                  <strong>Energy Output:</strong> {location.value} MW
                  <br />
                  <strong>Date:</strong> {location.period}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
};

export default EnergyMap;
