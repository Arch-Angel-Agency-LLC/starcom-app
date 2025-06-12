import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage/MainPage';
import SettingsPage from '../pages/SettingsPage/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import TokenGatedPage from '../components/Auth/TokenGatedPage';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/settings" element={
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    } />
    <Route path="/intelreports" element={
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    } />
    <Route path="/token-gated" element={
      <ProtectedRoute>
        <TokenGatedPage />
      </ProtectedRoute>
    } />
  </Routes>
);

export default AppRoutes;