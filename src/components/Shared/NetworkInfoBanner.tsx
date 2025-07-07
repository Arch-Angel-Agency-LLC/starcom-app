import React from 'react';

interface NetworkInfoBannerProps {
  currentNetwork: string;
  expectedNetwork: string;
  isCorrect: boolean;
}

const NetworkInfoBanner: React.FC<NetworkInfoBannerProps> = ({ currentNetwork, expectedNetwork, isCorrect }) => {
  return (
    <div
      className="network-info-banner"
      style={{
        background: isCorrect ? '#e0f7fa' : '#fff3e0',
        color: isCorrect ? '#006064' : '#bf360c',
        padding: '0.5rem 1rem',
        textAlign: 'center',
        fontWeight: 500,
        borderBottom: isCorrect ? '2px solid #4dd0e1' : '2px solid #ff7043',
      }}
      role="status"
      aria-live="polite"
    >
      {isCorrect ? (
        <>Connected to <b>{currentNetwork}</b> (expected: {expectedNetwork})</>
      ) : (
        <>Warning: Connected to <b>{currentNetwork}</b>, but expected <b>{expectedNetwork}</b>! Please switch networks.</>
      )}
    </div>
  );
};

export default NetworkInfoBanner;
