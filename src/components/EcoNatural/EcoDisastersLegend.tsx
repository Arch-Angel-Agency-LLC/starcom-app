import React, { useMemo, useId } from 'react';
import { Card, CardContent, Typography, Box, Chip, Stack, Tooltip, useMediaQuery, useTheme } from '@mui/material';

export interface EcoDisasterLegendCounts {
  minor: number;
  major: number;
  catastrophic: number;
}

export interface EcoDisastersLegendProps {
  counts: EcoDisasterLegendCounts;
  lastUpdated: number | null;
  stale: boolean;
  mockVolcanoes?: boolean;
}

const severityMeta = {
  catastrophic: { label: 'Catastrophic', color: '#ff4d4f' },
  major: { label: 'Major', color: '#fa8c16' },
  minor: { label: 'Minor', color: '#ffd666' }
} as const;

const formatTimeShort = (timestamp: number | null) => {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
};

const formatRelativeTime = (timestamp: number | null) => {
  if (!timestamp) return 'No recent updates';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60 * 1000) return 'Just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
};

export const EcoDisastersLegend: React.FC<EcoDisastersLegendProps> = ({ counts, lastUpdated, stale, mockVolcanoes }) => {
  const total = useMemo(() => counts.minor + counts.major + counts.catastrophic, [counts]);
  const preciseTime = lastUpdated ? new Date(lastUpdated).toISOString() : 'No update available';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mockDisclaimerId = useId();

  return (
    <Card variant="outlined" data-testid="eco-disasters-legend">
      <CardContent aria-live="polite">
        {mockVolcanoes && (
          <Box sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }} id={mockDisclaimerId}>
            Volcano data is mock; see FAQ link for details.
          </Box>
        )}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Legend</Typography>
          <Chip
            size="small"
            color={stale ? 'warning' : 'success'}
            label={stale ? 'Stale' : 'Fresh'}
            aria-label={`Legend freshness: ${stale ? 'Stale' : 'Fresh'}`}
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            gap: isMobile ? 0.75 : 1,
            mb: 1
          }}
        >
          {(Object.keys(severityMeta) as Array<keyof typeof severityMeta>).map((key) => (
            <Stack direction="row" alignItems="center" spacing={1} key={key}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: severityMeta[key].color }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {severityMeta[key].label}
              </Typography>
              <Chip size="small" label={counts[key]} variant="outlined" aria-label={`${severityMeta[key].label} count ${counts[key]}`} />
            </Stack>
          ))}
        </Box>

        <Tooltip title={preciseTime} placement="top" arrow disableInteractive>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Last updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {formatTimeShort(lastUpdated)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(lastUpdated)}
            </Typography>
          </Box>
        </Tooltip>

        {stale && (
          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
            Data is stale; showing last known good refresh.
          </Typography>
        )}

        {mockVolcanoes && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Volcano data is mock"
              aria-describedby={mockDisclaimerId}
            />
            <Typography
              variant="caption"
              component="a"
              href="https://github.com/Arch-Angel-Agency-LLC/starcom-app/blob/main/docs/ecoNatural/visualizations/EcologicalDisasters/faq.md#mock-volcano-data"
              target="_blank"
              rel="noreferrer"
              aria-label="Read FAQ about mock volcano data"
            >
              FAQ
            </Typography>
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Total markers: {total}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default EcoDisastersLegend;
