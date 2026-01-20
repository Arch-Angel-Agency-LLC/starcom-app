import React, { useId } from 'react';
import { Chip, Card, CardContent, Typography, Box, Button, Stack, Tooltip } from '@mui/material';

export interface EcoDisastersStatusCardProps {
  total: number;
  filtered: number;
  stale: boolean;
  lastUpdated: number | null;
  error?: string | null;
  mockVolcanoes?: boolean;
  onRetry?: () => void;
}

const formatTime = (timestamp: number | null) => {
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

export const EcoDisastersStatusCard: React.FC<EcoDisastersStatusCardProps> = ({
  total,
  filtered,
  stale,
  lastUpdated,
  error,
  mockVolcanoes = false,
  onRetry
}) => {
  const badgeColor = error ? 'error' : stale ? 'warning' : 'success';
  const badgeLabel = error ? 'Error' : stale ? 'Stale' : 'Fresh';
  const preciseTime = lastUpdated ? new Date(lastUpdated).toISOString() : 'No update available';
  const relativeTime = formatRelativeTime(lastUpdated);
  const mockDisclaimerId = useId();

  return (
    <Card variant="outlined" sx={{ mb: 2 }} data-testid="eco-status-card">
      <CardContent aria-live="polite">
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Eco Disasters Status</Typography>
          <Chip size="small" color={badgeColor as any} label={badgeLabel} aria-label={`Data freshness: ${badgeLabel}`} />
        </Stack>

        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Filtered
            </Typography>
            <Typography variant="h6">{filtered}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h6">{total}</Typography>
          </Box>
        </Box>

        <Tooltip title={preciseTime} placement="top" arrow disableInteractive>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Last updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }} aria-label={`Last updated ${preciseTime}`}>
              {formatTime(lastUpdated)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {relativeTime}
            </Typography>
          </Box>
        </Tooltip>

        {stale && (
          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
            Data is stale; showing last known good update.
          </Typography>
        )}

        {mockVolcanoes && (
          <Chip
            size="small"
            label="Volcano data is mock"
            color="warning"
            variant="outlined"
            sx={{ mb: 1 }}
            aria-label="Volcano data is mock"
            aria-describedby={mockDisclaimerId}
          />
        )}

        {mockVolcanoes && (
          <Typography variant="srOnly" component="span" id={mockDisclaimerId} sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            Volcano data is synthetic placeholder data.
          </Typography>
        )}

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {onRetry && (
          <Button size="small" variant="contained" onClick={onRetry} disabled={!!error === false && stale === false}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EcoDisastersStatusCard;
