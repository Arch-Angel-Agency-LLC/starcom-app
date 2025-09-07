import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import * as d3 from 'd3';

export interface TimelineHistogramProps {
  timestamps: number[]; // epoch ms
  domain: [number, number];
  range: [number, number];
  onChange: (range: [number, number]) => void;
  onCommit: (range: [number, number]) => void;
  onLast24h?: () => void;
  onClear?: () => void;
}

/**
 * TimelineHistogram: Minimal SVG histogram with a brushed time range.
 * - Computes bins from timestamps and renders bars.
 * - Supports drag-to-select and resize via handles.
 */
const TimelineHistogram: React.FC<TimelineHistogramProps> = ({
  timestamps,
  domain,
  range,
  onChange,
  onCommit,
  onLast24h,
  onClear
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(600);
  const height = 140;
  const padTop = 8;
  const padRight = 8;
  const padBottom = 20;
  const padLeft = 8;

  // Resize observer to keep chart responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.max(320, Math.floor(entry.contentRect.width));
        setWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const x = useMemo(() => {
    return d3.scaleTime()
      .domain([new Date(domain[0]), new Date(domain[1])])
      .range([padLeft, width - padRight]);
  }, [domain, width, padLeft, padRight]);

  const y = useMemo(() => d3.scaleLinear().range([height - padBottom, padTop]), [height, padBottom, padTop]);

  // Compute bins (adaptive threshold count based on width)
  interface BinLike { x0: number; x1: number; length: number }
  const bins = useMemo<BinLike[]>(() => {
    if (!timestamps || timestamps.length === 0) return [] as d3.Bin<number, number>[];
    const values = timestamps.slice().sort((a, b) => a - b).map(t => new Date(t));
    const thresholdCount = Math.max(10, Math.min(80, Math.floor((width - padLeft - padRight) / 8)));
    const generator = d3.bin<Date, Date>()
      .domain([new Date(domain[0]), new Date(domain[1])])
      .thresholds(thresholdCount)
      .value(d => d);
    const b: d3.Bin<Date, Date>[] = generator(values as unknown as Date[]);
    // Convert to number bins for rendering convenience
    const nbins: BinLike[] = b.map(bin => ({
      x0: (bin.x0 as unknown as Date)?.getTime?.() ?? domain[0],
      x1: (bin.x1 as unknown as Date)?.getTime?.() ?? domain[1],
      length: bin.length
    }));
    // Set y-domain
    const maxCount = Math.max(1, d3.max(nbins, d => d.length) || 1);
    y.domain([0, maxCount]);
    return nbins;
  }, [timestamps, domain, width, y, padLeft, padRight]);

  // Brush interaction state
  const [dragging, setDragging] = useState<null | 'move' | 'left' | 'right'>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const rangePx = useMemo<[number, number]>(() => [x(new Date(range[0])), x(new Date(range[1]))], [x, range]);

  const clampToDomain = useCallback((t: number) => Math.min(domain[1], Math.max(domain[0], t)), [domain]);

  const commit = useCallback((r: [number, number]) => {
    const sorted: [number, number] = r[0] <= r[1] ? r : [r[1], r[0]];
    onCommit(sorted);
  }, [onCommit]);

  const onMouseDown = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    const px = e.nativeEvent.offsetX;
    const [rx0, rx1] = rangePx;
    const handleWidth = 6;
    if (Math.abs(px - rx0) <= handleWidth) {
      setDragging('left');
    } else if (Math.abs(px - rx1) <= handleWidth) {
      setDragging('right');
    } else if (px > rx0 && px < rx1) {
      setDragging('move');
      setDragStartX(px);
    } else {
      // Start new selection center at click
      const t = x.invert(px).getTime();
      const half = (range[1] - range[0]) / 2;
      const newStart = clampToDomain(t - half);
      const newEnd = clampToDomain(t + half);
      onChange([newStart, newEnd]);
      setDragging('move');
      setDragStartX(px);
    }
  };

  const onMouseMove = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (!dragging) return;
    const px = e.nativeEvent.offsetX;
    if (dragging === 'move' && dragStartX != null) {
      const [rx0, rx1] = rangePx;
      const delta = px - dragStartX;
      const newPx0 = rx0 + delta;
      const newPx1 = rx1 + delta;
      const newT0 = clampToDomain(x.invert(newPx0).getTime());
      const newT1 = clampToDomain(x.invert(newPx1).getTime());
      onChange([newT0, newT1]);
      setDragStartX(px);
    }
    if (dragging === 'left') {
      const newT0 = clampToDomain(x.invert(px).getTime());
      onChange([newT0, range[1]]);
    }
    if (dragging === 'right') {
      const newT1 = clampToDomain(x.invert(px).getTime());
      onChange([range[0], newT1]);
    }
  };

  const onMouseUp = () => {
    if (dragging) {
      commit([range[0], range[1]]);
    }
    setDragging(null);
    setDragStartX(null);
  };

  const contentWidth = width - padLeft - padRight;
  const contentHeight = height - padTop - padBottom;

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Timeline</Typography>
  <svg
        role="img"
        aria-label="Timeline histogram"
        width={width}
        height={height}
        style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(0,255,65,0.2)' }}
        onMouseLeave={onMouseUp}
      >
        {/* Bars */}
        {bins.map((b, i) => {
          const x0 = x(new Date(b.x0));
          const x1 = x(new Date(b.x1));
          const w = Math.max(1, x1 - x0 - 1);
          const h = contentHeight - (y(b.length) - padTop);
          const rectX = x0 + 0.5;
          const rectY = y(b.length);
          return (
            <rect
              key={i}
              x={rectX}
              y={rectY}
              width={w}
              height={h}
              fill="#00bfff"
              opacity={0.6}
            />
          );
        })}
        {/* Brush overlay */}
        <g>
          {/* Selection area */}
          <rect
            x={rangePx[0]}
            y={padTop}
            width={Math.max(1, rangePx[1] - rangePx[0])}
            height={contentHeight}
            fill="#00ff41"
            opacity={0.15}
          />
          {/* Handles */}
          <rect x={rangePx[0] - 2} y={padTop} width={4} height={contentHeight} fill="#00ff41" />
          <rect x={rangePx[1] - 2} y={padTop} width={4} height={contentHeight} fill="#00ff41" />
          {/* Interaction capture */}
          <rect
            x={padLeft}
            y={padTop}
            width={contentWidth}
            height={contentHeight}
            fill="transparent"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
        </g>
        {/* Axis (simple ticks) */}
        {
          (() => {
            const axisTicks = x.ticks(5);
            return (
              <g>
                {axisTicks.map((t, i) => (
                  <g key={i}>
                    <line x1={x(t)} x2={x(t)} y1={height - padBottom} y2={height - padBottom + 4} stroke="#888" />
                    <text x={x(t)} y={height - padBottom + 14} textAnchor="middle" fontSize={10} fill="#aaa">
                      {d3.timeFormat('%H:%M')(t as Date)}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()
        }
      </svg>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        {onLast24h && <Button variant="outlined" size="small" onClick={onLast24h}>Last 24h</Button>}
        {onClear && <Button variant="outlined" size="small" onClick={onClear}>Clear</Button>}
        <Button variant="outlined" size="small" onClick={() => commit(range)}>Apply</Button>
      </Stack>
    </Box>
  );
};

export default TimelineHistogram;
