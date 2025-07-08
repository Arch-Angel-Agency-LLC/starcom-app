/**
 * GridWrapper.tsx
 * 
 * Wrapper component for MUI Grid to handle incompatible prop types
 * across different MUI versions.
 */

import React from 'react';
import { Grid } from '@mui/material';

interface GridWrapperProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  spacing?: number;
  children: React.ReactNode;
  sx?: Record<string, unknown>;
}

/**
 * Wrapper for MUI Grid component to handle version differences
 */
const GridWrapper: React.FC<GridWrapperProps> = ({
  item,
  container,
  xs,
  sm,
  md,
  lg,
  xl,
  spacing,
  children,
  sx
}) => {
  const props: Record<string, unknown> = {
    // Always include the component prop for compatibility
    component: 'div',
    sx
  };

  // Add props conditionally
  if (item) props.item = true;
  if (container) props.container = true;
  if (xs !== undefined) props.xs = xs;
  if (sm !== undefined) props.sm = sm;
  if (md !== undefined) props.md = md;
  if (lg !== undefined) props.lg = lg;
  if (xl !== undefined) props.xl = xl;
  if (spacing !== undefined) props.spacing = spacing;

  return <Grid {...props}>{children}</Grid>;
};

export default GridWrapper;
