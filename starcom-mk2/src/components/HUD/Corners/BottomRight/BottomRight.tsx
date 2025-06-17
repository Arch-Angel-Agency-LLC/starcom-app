import React, { useState } from 'react';
import styles from './BottomRight.module.css';
import { IntelReport } from '../../../../models/IntelReport';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { mintIntelToken } from '../../../../services/tokenService';
import { mintIntelReportNFT } from '../../../../services/nftService';

const BottomRight: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    lat: '',
    long: '',
    title: '',
    subtitle: '',
    date: '',
    author: '',
    content: '',
    tags: '',
    categories: '',
    metaDescription: '',
  });
  const [status, setStatus] = useState<string>('');
  const { publicKey, signTransaction, connected } = useWallet();

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newIntelReport = new IntelReport(
      parseFloat(formData.lat),
      parseFloat(formData.long),
      formData.title,
      formData.subtitle,
      formData.date,
      formData.author,
      formData.content,
      formData.tags.split(',').map((tag) => tag.trim()),
      formData.categories.split(',').map((category) => category.trim()),
      formData.metaDescription
    );
    console.log('Intel Report Submitted:', newIntelReport);
    handleClosePopup();
  };

  const handleMintToken = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setStatus('Please connect your wallet.');
      return;
    }
    setStatus('Minting SPL Token...');
    try {
      await mintIntelToken();
      setStatus('SPL Token minted! (see console for details)');
    } catch {
      setStatus('Error minting SPL Token');
    }
  };

  const handleMintNFT = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setStatus('Please connect your wallet.');
      return;
    }
    setStatus('Minting NFT...');
    try {
      await mintIntelReportNFT();
      setStatus('NFT minted! (see console for details)');
    } catch {
      setStatus('Error minting NFT');
    }
  };

  return (
    <div className={styles.bottomRight}>
      <button className={styles.createButton} onClick={handleOpenPopup}>
        Create Intel Report
      </button>

      {isPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 32 }}>
              {/* Left: Intel Report Form */}
              <div style={{ flex: 2, minWidth: 320 }}>
                <h2 className={styles.header}>Create Intel Report</h2>
                <form onSubmit={handleSubmit} className={styles.content}>
                  <input
                    type="text"
                    name="lat"
                    placeholder="Latitude"
                    value={formData.lat}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="long"
                    placeholder="Longitude"
                    value={formData.long}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="subtitle"
                    placeholder="Subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                  />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="author"
                    placeholder="Author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                  />
                  <textarea
                    name="content"
                    placeholder="Content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="tags"
                    placeholder="Tags (comma-separated)"
                    value={formData.tags}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="categories"
                    placeholder="Categories (comma-separated)"
                    value={formData.categories}
                    onChange={handleChange}
                  />
                  <textarea
                    name="metaDescription"
                    placeholder="Meta Description"
                    value={formData.metaDescription}
                    onChange={handleChange}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="submit">Submit</button>
                    <button type="button" onClick={handleClosePopup}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
              {/* Right: Wallet & Minting Actions */}
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 16,
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
                <div style={{ marginTop: 16, minHeight: 24, color: '#00C4FF', textAlign: 'center' }}>{status}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomRight;