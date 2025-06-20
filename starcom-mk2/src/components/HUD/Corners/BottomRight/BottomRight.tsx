import React, { useState } from 'react';
import styles from './BottomRight.module.css';
import { IntelReport } from '../../../../models/IntelReport';
import { IntelReportFormData } from './IntelReportFormData';
import { useWallet } from '@solana/wallet-adapter-react';
import { mintIntelToken } from '../../../../services/tokenService';
import { mintIntelReportNFT } from '../../../../services/nftService';
import { submitIntelReport } from '../../../../api/intelligence';
import SubmitIntelReportPopup from './SubmitIntelReportPopup';

const BottomRight: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState<IntelReportFormData>({
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
    setFormData((prev: IntelReportFormData) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!connected || !publicKey || !signTransaction) {
      setStatus('Please connect your wallet to submit reports.');
      return;
    }

    setStatus('Submitting Intel Report to Solana...');
    
    try {
      // Create report data for blockchain submission
      const reportData = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag),
        latitude: parseFloat(formData.lat) || 0,
        longitude: parseFloat(formData.long) || 0,
      };

      // Submit to Solana blockchain
      const signature = await submitIntelReport(reportData, { publicKey, signTransaction });
      
      setStatus(`Report submitted successfully! Tx: ${signature.substring(0, 8)}...`);
      
      // Also create local IntelReport object for logging/debugging
      const newIntelReport = new IntelReport(
        parseFloat(formData.lat),
        parseFloat(formData.long),
        formData.title,
        formData.subtitle,
        formData.date,
        formData.author,
        formData.content,
        formData.tags.split(',').map((tag: string) => tag.trim()),
        formData.categories.split(',').map((category: string) => category.trim()),
        formData.metaDescription
      );
      
      console.log('Intel Report Submitted to Blockchain:', {
        signature,
        report: newIntelReport,
        publicKey: publicKey.toString()
      });
      
      // Reset form and close popup after success
      setTimeout(() => {
        setStatus('');
        handleClosePopup();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting intel report:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData((prev: IntelReportFormData) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        }));
      });
    }
  };

  const handleMapSelect = (lat: string, long: string) => {
    setFormData((prev: IntelReportFormData) => ({ ...prev, lat, long }));
  };

  return (
    <div className={styles.bottomRight}>
      <button className={styles.createButton} onClick={handleOpenPopup}>
        Create Intel Report
      </button>

      <SubmitIntelReportPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleMintToken={handleMintToken}
        handleMintNFT={handleMintNFT}
        status={status}
        handleAutoLocation={handleAutoLocation}
        mapSelectorProps={{
          lat: formData.lat,
          long: formData.long,
          onSelect: handleMapSelect,
        }}
      />
    </div>
  );
};

export default BottomRight;