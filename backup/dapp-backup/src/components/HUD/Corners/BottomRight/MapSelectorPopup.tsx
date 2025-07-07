import React, { useState, useEffect } from 'react';
import MapSelector from './MapSelector';

interface MapSelectorPopupProps {
  isOpen: boolean;
  lat: string;
  long: string;
  onSelect: (lat: string, long: string) => void;
  onClose: () => void;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2';

const MapSelectorPopup: React.FC<MapSelectorPopupProps> = ({ isOpen, lat, long, onSelect, onClose }) => {
  const [tempLat, setTempLat] = useState(lat);
  const [tempLong, setTempLong] = useState(long);
  const [address, setAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Update temp values if props change (e.g., opening popup with new values)
  useEffect(() => {
    setTempLat(lat);
    setTempLong(long);
  }, [lat, long, isOpen]);

  // Fetch address when tempLat/tempLong change
  useEffect(() => {
    async function fetchAddress() {
      if (!tempLat || !tempLong || isNaN(Number(tempLat)) || isNaN(Number(tempLong))) {
        setAddress('');
        setAddressError('');
        return;
      }
      setAddressLoading(true);
      setAddressError('');
      try {
        const resp = await fetch(`${NOMINATIM_URL}&lat=${tempLat}&lon=${tempLong}`);
        if (!resp.ok) throw new Error('Network error');
        const data = await resp.json();
        setAddress(data.display_name || 'Unknown location');
      } catch {
        setAddress('');
        setAddressError('Could not fetch address');
      } finally {
        setAddressLoading(false);
      }
    }
    fetchAddress();
  }, [tempLat, tempLong]);

  if (!isOpen) return null;
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempLat(e.target.value);
  };
  const handleLongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempLong(e.target.value);
  };
  const handleMapLatLongChange = (lat: string, long: string) => {
    setTempLat(lat);
    setTempLong(long);
  };
  const handleConfirm = () => {
    onSelect(tempLat, tempLong);
    onClose();
  };
  const handleCancel = () => {
    onClose();
  };
  const isLatValid = tempLat && !isNaN(Number(tempLat)) && Number(tempLat) >= -90 && Number(tempLat) <= 90;
  const isLongValid = tempLong && !isNaN(Number(tempLong)) && Number(tempLong) >= -180 && Number(tempLong) <= 180;
  const isValid = isLatValid && isLongValid;

  return (
    <div
      style={{ position: 'fixed', zIndex: 1001, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#181c24',
          borderRadius: 12,
          boxShadow: '0 0 24px #00C4FF55',
          padding: 32,
          minWidth: 900,
          minHeight: 700,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 style={{ color: '#00C4FF', marginBottom: 10, fontSize: 22 }}>Pick Location on Map</h3>
        <div style={{ color: '#aaa', fontSize: 15, marginBottom: 8 }}>Click or drag the marker to select a location. You can also enter coordinates manually.</div>
        <MapSelector
          lat={tempLat}
          long={tempLong}
          onLatLongChange={handleMapLatLongChange}
        />
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, margin: '12px 0 0 0', alignItems: 'center' }}>
          <label style={{ color: '#00C4FF', fontSize: 14 }}>Latitude:</label>
          <input
            type="text"
            value={tempLat}
            onChange={handleLatChange}
            style={{ width: 100, borderRadius: 4, border: '1px solid #333', padding: '4px 8px', background: '#222', color: '#fff' }}
            aria-label="Latitude"
          />
          <label style={{ color: '#00C4FF', fontSize: 14 }}>Longitude:</label>
          <input
            type="text"
            value={tempLong}
            onChange={handleLongChange}
            style={{ width: 100, borderRadius: 4, border: '1px solid #333', padding: '4px 8px', background: '#222', color: '#fff' }}
            aria-label="Longitude"
          />
        </div>
        <div style={{ margin: '10px 0', color: '#00C4FF', fontSize: 14, minHeight: 20 }}>
          {addressLoading ? 'Loading address…' : addressError ? addressError : address ? address : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 18, marginTop: 18 }}>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            style={{ background: isValid ? '#00C4FF' : '#444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 28px', fontSize: 16, cursor: isValid ? 'pointer' : 'not-allowed' }}
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            style={{ background: '#222', color: '#00C4FF', border: '1.5px solid #00C4FF', borderRadius: 6, padding: '8px 28px', fontSize: 16 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelectorPopup;
