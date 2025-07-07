import React from 'react';
import styles from './BottomRight.module.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { IntelReportFormData } from './IntelReportFormData';
import MapSelectorPopup from './MapSelectorPopup';

interface SubmitIntelReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  formData: IntelReportFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleMintToken: () => void;
  handleMintNFT: () => void;
  status: string;
  handleAutoLocation: () => void;
  mapSelectorProps: {
    lat: string;
    long: string;
    onSelect: (lat: string, long: string) => void;
  };
}

const SubmitIntelReportPopup: React.FC<SubmitIntelReportPopupProps> = ({
  isOpen,
  onClose,
  formData,
  handleChange,
  handleSubmit,
  handleMintToken,
  handleMintNFT,
  status,
  handleAutoLocation,
  mapSelectorProps,
}) => {
  const [isMapPopupOpen, setIsMapPopupOpen] = React.useState(false);

  // If map popup is open, clicking the backdrop should only close the map popup, not the main popup
  const handleBackdropClick = () => {
    if (isMapPopupOpen) {
      setIsMapPopupOpen(false);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;
  return (
    <div className={styles.popupBackdrop} onClick={handleBackdropClick}>
      <div
        className={styles.popup}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.popupContent}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 36, width: '100%', justifyContent: 'center', alignItems: 'flex-start' }}>
            {/* Left: Intel Report Form */}
            <form onSubmit={handleSubmit} className={styles.formColumns} style={{ minWidth: 420, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Form fields */}
              <div className={styles.formCol} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  name="title"
                  placeholder="Title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
                <input
                  type="text"
                  name="subtitle"
                  placeholder="Subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
                <input
                  type="text"
                  name="author"
                  placeholder="Author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
                <textarea
                  name="content"
                  placeholder="Content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  style={{ minHeight: 60 }}
                />
                <input
                  type="text"
                  name="tags"
                  placeholder="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <input
                  type="text"
                  name="categories"
                  placeholder="Categories (comma-separated)"
                  value={formData.categories}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <textarea
                  name="metaDescription"
                  placeholder="Meta Description"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  autoComplete="off"
                  style={{ minHeight: 40 }}
                />
                {/* Location Controls - all in one row */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <input
                    type="text"
                    name="lat"
                    placeholder="Latitude"
                    value={formData.lat}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    style={{ width: 100 }}
                    />
                    <input
                    type="text"
                    name="long"
                    placeholder="Longitude"
                    value={formData.long}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    style={{ width: 100 }}
                    />
                    <input type="checkbox" id="autoLocation" onChange={handleAutoLocation} style={{ marginLeft: 10 }} />
                    <label htmlFor="autoLocation" style={{ cursor: 'pointer', fontSize: 13, margin: 0, whiteSpace: 'nowrap' }}>Use my current location</label>
                    <button type="button" onClick={() => setIsMapPopupOpen(true)} style={{ marginLeft: 10, background: '#222', color: '#00C4FF', border: '1.5px solid #00C4FF', borderRadius: 6, padding: '4px 12px', fontSize: 13, whiteSpace: 'nowrap' }}>
                    🗺️ Map
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit">Submit</button>
                  <button type="button" onClick={onClose} style={{ background: '#222', color: '#00C4FF', border: '1.5px solid #00C4FF' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
            {/* Right: Wallet & Minting Actions */}
            <div
              style={{
                flex: 1,
                minWidth: 220,
                maxWidth: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 18,
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 12,
                boxShadow: '0 0 16px #00C4FF55',
                padding: 18,
                marginLeft: 0,
              }}
            >
              <h3 className={styles.header}>Wallet & Mint</h3>
              <div style={{ margin: '16px 0' }}>
                <WalletMultiButton />
              </div>
              <button onClick={handleMintToken} style={{ marginTop: 12, width: '100%' }}>
                Mint SPL Token
              </button>
              <button onClick={handleMintNFT} style={{ marginTop: 8, width: '100%' }}>
                Mint Intel Report NFT
              </button>
              <div style={{ marginTop: 16, minHeight: 24, color: '#00C4FF', textAlign: 'center', textShadow: '0 0 8px #00C4FF' }}>{status}</div>
            </div>
          </div>
        </div>
      </div>
      <MapSelectorPopup
        isOpen={isMapPopupOpen}
        lat={formData.lat}
        long={formData.long}
        onSelect={mapSelectorProps.onSelect}
        onClose={() => setIsMapPopupOpen(false)}
      />
    </div>
  );
};

export default SubmitIntelReportPopup;
