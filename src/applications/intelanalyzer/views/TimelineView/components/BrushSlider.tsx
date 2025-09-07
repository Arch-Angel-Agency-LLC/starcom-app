import React from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';

export interface BrushSliderProps {
  domain: [number, number];
  range: [number, number];
  onChange: (range: [number, number]) => void;
  onCommit: (range: [number, number]) => void;
  onLast24h: () => void;
  onClear: () => void;
  onSelectFirst?: () => void;
}

const BrushSlider: React.FC<BrushSliderProps> = ({
  domain,
  range,
  onChange,
  onCommit,
  onLast24h,
  onClear,
  onSelectFirst
}) => {
  return (
    <Box sx={{
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      border: '1px solid rgba(0, 255, 65, 0.2)',
      borderRadius: 1,
      p: 2,
      mb: 2
    }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
        Brush Range
      </Typography>
      <Slider
        value={range}
        min={domain[0]}
        max={domain[1]}
        onChange={(_, value) => Array.isArray(value) && onChange([value[0], value[1]])}
        onChangeCommitted={(_, value) => Array.isArray(value) && onCommit([value[0], value[1]])}
        valueLabelDisplay="auto"
        getAriaValueText={(v) => new Date(v).toLocaleString()}
        valueLabelFormat={(v) => new Date(v).toLocaleTimeString()}
        sx={{ mt: 2 }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button variant="outlined" size="small" onClick={onLast24h}>
          Last 24h
        </Button>
        <Button variant="outlined" size="small" onClick={onClear}>
          Clear
        </Button>
        {onSelectFirst && (
          <Button variant="outlined" size="small" onClick={onSelectFirst}>
            Select First
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default BrushSlider;
