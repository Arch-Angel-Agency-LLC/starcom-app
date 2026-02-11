import React, { useEffect, useRef } from 'react';
import styles from './SupportFunnelModal.module.css';

type SupportFundModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fundUrl: string;
};

const buildEmbedHtml = (fundUrl: string) =>
  `<div class="gfm-embed" data-url="${fundUrl}/widget/large?sharesheet=undefined&attribution_id=sl:fc34e218-c87e-420b-aaa4-faa279daf854"></div>`;

const SupportFundModal: React.FC<SupportFundModalProps> = ({ isOpen, onClose, fundUrl }) => {
  const embedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (embedRef.current) {
      embedRef.current.innerHTML = buildEmbedHtml(fundUrl);
    }

    const script = document.createElement('script');
    script.src = 'https://www.gofundme.com/static/js/embed.js';
    script.defer = true;
    script.dataset.injectedBy = 'support-fund-modal';
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isOpen, fundUrl]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Support Starcom fundraiser">
      <div className={styles.fundModal}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close fundraiser modal">
          ✕
        </button>
        <div className={styles.fundHeader}>
          <h3 className={styles.fundTitle}>Support the Starcom Initiative</h3>
          <p className={styles.fundSubtitle}>Fuel the buildout of the Earth Intelligence Network via GoFundMe.</p>
        </div>
        <div className={styles.fundEmbed}>
          <div ref={embedRef} aria-label="GoFundMe embed" />
        </div>
        <div className={styles.fundFooter}>
          <a className={styles.fundLink} href={fundUrl} target="_blank" rel="noreferrer">
            Open GoFundMe in a new tab
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportFundModal;