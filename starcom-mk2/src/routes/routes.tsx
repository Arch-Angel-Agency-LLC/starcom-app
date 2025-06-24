import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage/MainPage';
import SettingsPage from '../pages/SettingsPage/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import TokenGatedPage from '../components/Auth/TokenGatedPage';
import AuthDemoPage from '../components/Demo/AuthDemoPage';
import UXFlowIntegrationTest from '../components/Testing/UXFlowIntegrationTest';

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
    <Route path="/auth-demo" element={<AuthDemoPage />} />
    <Route path="/test-ui" element={<UXFlowIntegrationTest />} />
    <Route path="/ux-test" element={<UXFlowIntegrationTest />} />
  </Routes>
);

export default AppRoutes;