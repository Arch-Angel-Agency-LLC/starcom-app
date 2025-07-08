/**
 * ListItemWrapper.tsx
 * 
 * Wrapper component for MUI ListItem to handle incompatible prop types
 * across different MUI versions.
 */

import React from 'react';
import { ListItem } from '@mui/material';

interface ListItemWrapperProps {
  button?: boolean;
  selected?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  sx?: Record<string, unknown>;
  key?: string;
  secondaryAction?: React.ReactNode;
  disablePadding?: boolean;
  divider?: boolean;
}

/**
 * Wrapper for MUI ListItem component to handle version differences
 */
const ListItemWrapper: React.FC<ListItemWrapperProps> = ({
  button,
  selected,
  children,
  onClick,
  sx,
  key,
  secondaryAction,
  disablePadding,
  divider
}) => {
  const props: Record<string, unknown> = {
    // Always include the component prop for compatibility
    component: 'div',
    sx,
    onClick
  };

  // Add props conditionally
  if (button) props.button = true;
  if (selected) props.selected = true;
  if (key) props.key = key;
  if (secondaryAction) props.secondaryAction = secondaryAction;
  if (disablePadding) props.disablePadding = true;
  if (divider) props.divider = true;

  return <ListItem {...props}>{children}</ListItem>;
};

export default ListItemWrapper;
