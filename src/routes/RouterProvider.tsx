import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';

type RouterProviderProps = {
  children: React.ReactNode;
};

// Select router mode via env flags
// Preferred flags:
// - VITE_ROUTER_MODE=browser|hash
// - VITE_TARGET=vercel|ipfs (ipfs implies hash)
const getRouterMode = (): 'browser' | 'hash' => {
  const mode = import.meta.env.VITE_ROUTER_MODE as 'browser' | 'hash' | undefined;
  if (mode === 'browser' || mode === 'hash') return mode;
  const target = import.meta.env.VITE_TARGET as string | undefined;
  if (target === 'ipfs') return 'hash';
  return 'browser';
};

export const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  const mode = getRouterMode();
  return mode === 'hash' ? (
    <HashRouter>{children}</HashRouter>
  ) : (
    <BrowserRouter>{children}</BrowserRouter>
  );
};

export default RouterProvider;
