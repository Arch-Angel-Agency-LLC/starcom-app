import React, { useState } from 'react';

// AI-NOTE: TermsModal enforces user acceptance of terms before wallet connection (see artifacts)
const TERMS_KEY = 'starcom-terms-accepted';

const TermsModal: React.FC<{ onAccept: () => void }> = ({ onAccept }) => {
  const [show, setShow] = useState(() => !localStorage.getItem(TERMS_KEY));

  const handleAccept = () => {
    localStorage.setItem(TERMS_KEY, 'true');
    setShow(false);
    onAccept();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      role="dialog"
      aria-modal="true"
      aria-label="Terms & Conditions"
    >
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-2">Terms & Conditions</h2>
        <div className="mb-4 text-sm max-h-60 overflow-y-auto">
          <p>By connecting your wallet, you agree to the Starcom App Terms of Service and Privacy Policy. You must accept these terms to use web3 features.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAccept}>
          I Accept
        </button>
      </div>
    </div>
  );
};

export default TermsModal;
