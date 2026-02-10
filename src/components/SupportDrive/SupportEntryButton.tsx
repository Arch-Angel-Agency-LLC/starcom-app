import React from 'react';
import styles from './SupportEntryButton.module.css';

interface SupportEntryButtonProps {
  onOpen: () => void;
}

const SupportEntryButton: React.FC<SupportEntryButtonProps> = ({ onOpen }) => {
  return (
    <button
      type="button"
      className={styles.supportButton}
      onClick={onOpen}
      aria-label="Support the mission"
    >
      <span role="img" aria-hidden="true">
        💠
      </span>
      <span className={styles.label}>Support</span>
    </button>
  );
};

export default SupportEntryButton;
