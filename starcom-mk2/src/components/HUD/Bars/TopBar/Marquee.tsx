// Marquee.tsx
// Artifact-driven: horizontally scrolling news/data ticker for TopBar
import React, { useRef, useEffect, useState } from 'react';
import styles from './Marquee.module.css';

// Local fallback type for MarqueeProps (artifact-driven, matches TopBar usage)
export interface MarqueeDataPoint {
  id: string;
  label: string;
  icon: string;
  value: string;
}

export interface MarqueeProps {
  dataPoints: MarqueeDataPoint[];
  loading?: boolean;
  error?: string | null;
}

const SCROLL_SPEED = 1; // px per frame

const Marquee: React.FC<MarqueeProps> = ({ dataPoints, loading = false, error = null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // Measure content width for seamless looping
  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
    setOffset(0); // Reset offset on data change
  }, [dataPoints]);

  // Auto-animate marquee (continuous, seamless loop)
  useEffect(() => {
    if (paused || !contentWidth) return;
    let frame: number;
    function step() {
      setOffset(prev => {
        // Loop seamlessly: when offset reaches contentWidth, reset to 0
        const next = prev - SCROLL_SPEED;
        return Math.abs(next) >= contentWidth ? 0 : next;
      });
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [paused, contentWidth, dataPoints]);

  // Pause on hover/focus
  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);

  if (loading) {
    return <div className={styles.marqueeEmpty} role="status" aria-live="polite">Loading data...</div>;
  }
  if (error) {
    return <div className={styles.marqueeError} role="alert" aria-live="assertive">Error: {error}</div>;
  }
  if (!dataPoints.length) {
    return <div className={styles.marqueeEmpty} role="region" aria-label="marquee-empty">No data selected.</div>;
  }

  // Render two copies for seamless looping
  return (
    <div
      ref={containerRef}
      className={styles.marquee}
      aria-live="polite"
      role="region"
      aria-label="marquee"
      tabIndex={0}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      aria-describedby="marquee-desc"
    >
      <span id="marquee-desc" className="sr-only">
        Auto-animating news ticker. Press Tab to focus, hover to pause.
      </span>
      <div
        ref={contentRef}
        className={styles.marqueeContent}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {dataPoints.concat(dataPoints).map((dp, i) => (
          <span key={dp.id + '-' + i} className={styles.marqueeItem} aria-label={`${dp.label}: ${dp.value}`}
            aria-hidden={i >= dataPoints.length ? 'true' : undefined}>
            <span className={styles.marqueeIcon} aria-hidden="true">{dp.icon}</span>
            <span>{dp.label}</span>
            <span className={styles.marqueeValue}>{dp.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
// AI-NOTE: Marquee is accessible, pauses on hover/focus, loops, and is responsive.
