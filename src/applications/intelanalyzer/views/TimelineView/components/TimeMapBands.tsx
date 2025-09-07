import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import * as d3 from 'd3';

export interface TimeMapLiteEvent {
  id: string;
  timestamp: string; // ISO
  category: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
}

interface TimeMapBandsProps {
  events: TimeMapLiteEvent[];
  domain: [number, number];
  selectedId?: string | null;
  onEventClick?: (id: string) => void;
  height?: number;
  currentRange?: [number, number];
  // Optional anomaly overlays
  showAnomalyBands?: boolean;
  anomalyDays?: Set<string>;
}

const TimeMapBands: React.FC<TimeMapBandsProps> = ({ events, domain, selectedId, onEventClick, height = 200, currentRange, showAnomalyBands = false, anomalyDays }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(Math.max(320, Math.floor(entry.contentRect.width)));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { top: 16, right: 8, bottom: 24, left: 90 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const x = useMemo(() => d3.scaleTime<Date, number>()
    .domain([new Date(domain[0]), new Date(domain[1])])
    .range([0, innerW])
  , [domain, innerW]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(e.category || 'Uncategorized'));
    return Array.from(set).sort();
  }, [events]);

  const yBand = useMemo(() => d3.scaleBand<string>()
    .domain(categories)
    .range([0, innerH])
    .paddingInner(0.3)
  , [categories, innerH]);

  const severityColor = (sev?: string) => {
    switch (sev) {
      case 'critical': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      default: return '#00bfff';
    }
  };

  // Convert anomaly day key (YYYY-MM-DD) to [startMs, endMs]
  const anomalyRanges: Array<[number, number]> = useMemo(() => {
    if (!showAnomalyBands || !anomalyDays || anomalyDays.size === 0) return [];
    const ranges: Array<[number, number]> = [];
    anomalyDays.forEach(key => {
      const start = new Date(`${key}T00:00:00.000Z`).getTime();
      const end = new Date(`${key}T23:59:59.999Z`).getTime();
      // clamp to domain
      const clampedStart = Math.max(start, domain[0]);
      const clampedEnd = Math.min(end, domain[1]);
      if (clampedEnd > clampedStart) ranges.push([clampedStart, clampedEnd]);
    });
    // Merge overlapping ranges for cleanliness
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const r of ranges) {
      if (merged.length === 0) merged.push(r);
      else {
        const last = merged[merged.length - 1];
        if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
        else merged.push(r);
      }
    }
    return merged;
  }, [showAnomalyBands, anomalyDays, domain]);

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Events</Typography>
      <svg width={width} height={height} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,65,0.2)' }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Anomaly day vertical bands (behind events) */}
          {anomalyRanges.map((r, idx) => {
            const x1 = x(new Date(r[0]));
            const x2 = x(new Date(r[1]));
            const w = Math.max(1, x2 - x1);
            return (
              <rect
                key={`anomaly-${idx}`}
                data-testid="anomaly-band"
                x={x1}
                y={0}
                width={w}
                height={innerH}
                fill="rgba(255,170,0,0.15)"
                stroke="rgba(255,170,0,0.35)"
                strokeWidth={1}
              />
            );
          })}
          {/* Category lanes */}
          {categories.map(cat => (
            <g key={cat}>
              <text x={-8} y={(yBand(cat) || 0) + (yBand.bandwidth()/2)} dy={3}
                    textAnchor="end" fontSize={11} fill="#aaa">{cat}</text>
              <rect x={0} y={yBand(cat)} width={innerW} height={yBand.bandwidth()} fill="rgba(255,255,255,0.02)" />
            </g>
          ))}

          {/* Event dots */}
          {events.map(e => {
            const t = new Date(e.timestamp);
            const cx = x(t);
            const cy = (yBand(e.category || 'Uncategorized') || 0) + (yBand.bandwidth()/2);
            const selected = selectedId === e.id;
            const tMs = t.getTime();
            const inRange = currentRange ? (tMs >= currentRange[0] && tMs <= currentRange[1]) : true;
            return (
              <circle
                key={e.id}
                cx={cx}
                cy={cy}
                r={selected ? 5 : 3}
                fill={selected ? '#00ff41' : severityColor(e.severity)}
                stroke={selected ? '#00ff41' : 'transparent'}
                strokeWidth={selected ? 1 : 0}
                opacity={selected ? 1 : (inRange ? 0.9 : 0.2)}
                style={{ cursor: 'pointer' }}
                onClick={() => onEventClick?.(e.id)}
              />
            );
          })}

          {/* Time axis */}
          {x.ticks(6).map((t, i) => (
            <g key={i} transform={`translate(${x(t)},0)`}>
              <line x1={0} x2={0} y1={innerH} y2={innerH + 4} stroke="#888" />
              <text x={0} y={innerH + 14} textAnchor="middle" fontSize={10} fill="#aaa">
                {d3.timeFormat('%Y-%m-%d %H:%M')(t as Date)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </Box>
  );
};

export default TimeMapBands;
