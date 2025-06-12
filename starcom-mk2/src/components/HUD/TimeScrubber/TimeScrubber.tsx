import React from 'react';

interface TimeScrubberProps {
  currentTime: number;
  isLive: boolean;
  onTimeChange: (time: number) => void;
  onToggleLive: (isLive: boolean) => void;
}

const TimeScrubber: React.FC<TimeScrubberProps> = ({ currentTime, isLive, onTimeChange, onToggleLive }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <input
        type="range"
        min={0}
        max={100}
        value={currentTime}
        onChange={(e) => onTimeChange(Number(e.target.value))}
        disabled={isLive}
      />
      <button onClick={() => onToggleLive(!isLive)}>
        {isLive ? 'Stop Live' : 'Go Live'}
      </button>
    </div>
  );
};

export default TimeScrubber;