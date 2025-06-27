import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage/MainPage';
import SettingsPage from '../pages/SettingsPage/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import TokenGatedPage from '../components/Auth/TokenGatedPage';
import AuthDemoPage from '../components/Demo/AuthDemoPage';
import UXFlowIntegrationTest from '../components/Testing/UXFlowIntegrationTest';
import CyberInvestigationMVP from '../components/CyberInvestigation/CyberInvestigationMVP';
import IPFSNostrIntegrationDemo from '../components/Demo/IPFSNostrIntegrationDemo';

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
    <Route path="/cyber-investigation" element={
      <ProtectedRoute>
        <CyberInvestigationMVP />
      </ProtectedRoute>
    } />
    <Route path="/token-gated" element={
      <ProtectedRoute>
        <TokenGatedPage />
      </ProtectedRoute>
    } />
    <Route path="/auth-demo" element={<AuthDemoPage />} />
    <Route path="/ipfs-nostr-demo" element={<IPFSNostrIntegrationDemo />} />
    <Route path="/test-ui" element={<UXFlowIntegrationTest />} />
    <Route path="/ux-test" element={<UXFlowIntegrationTest />} />
  </Routes>
);

export default AppRoutes;