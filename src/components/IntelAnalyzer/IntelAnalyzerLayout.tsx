import React from 'react';
import styles from './IntelAnalyzerLayout.module.css';

interface IntelAnalyzerLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

/**
 * IntelAnalyzerLayout
 * Centralized layout + scroll container for the IntelAnalyzer application.
 * Provides:
 *  - Consistent background & scanline overlay
 *  - Sticky header region
 *  - Internal scroll area confined to application space (not page-level)
 *  - Width constraints for large desktop readability
 */
export const IntelAnalyzerLayout: React.FC<IntelAnalyzerLayoutProps> = ({ children, header }) => {
  return (
    <div className={styles.intelAnalyzerRoot}>
      {header ? (
        <div className={styles.header}>{header}</div>
      ) : null}
      <div className={styles.scrollArea}>
        <div className={styles.constrainedWidth}>{children}</div>
      </div>
    </div>
  );
};

export default IntelAnalyzerLayout;
