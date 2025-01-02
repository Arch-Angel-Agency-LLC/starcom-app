import React from 'react';

const TimeScrubber: React.FC<{ onChange: (value: number) => void }> = ({ onChange }) => {
  return (
    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
      <input
        type="range"
        min="0"
        max="100"
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '300px' }}
      />
    </div>
  );
};

export default TimeScrubber;