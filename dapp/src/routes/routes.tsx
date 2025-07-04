import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage/MainPage';
import SettingsPage from '../pages/SettingsPage/SettingsPage';
import IntelReportsPage from '../pages/IntelReportsPage';
import ProtectedRoute from './ProtectedRoute';
import TokenGatedPage from '../components/Auth/TokenGatedPage';
import AuthDemoPage from '../components/Demo/AuthDemoPage';
import UXFlowIntegrationTest from '../components/Testing/UXFlowIntegrationTest';
import CyberInvestigationMVP from '../components/CyberInvestigation/CyberInvestigationMVP';
import IPFSNostrIntegrationDemo from '../components/Demo/IPFSNostrIntegrationDemo';
import ChatDemoPage from '../pages/Demo/ChatDemoPage';

// New page imports
import TeamsDashboard from '../pages/Teams/TeamsDashboard';
import TeamWorkspace from '../pages/Teams/TeamWorkspace';
import InvestigationsDashboard from '../pages/Investigations/InvestigationsDashboard';
import IntelDashboard from '../pages/Intel/IntelDashboard';
import NewReportPage from '../pages/Reports/NewReportPage'; // Import the new report page

// Layout imports
import BaseLayout from '../layouts/BaseLayout/BaseLayout';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Primary Globe Interface - unchanged */}
    <Route path="/" element={<MainPage />} />
    
    {/* Team Management Routes */}
    <Route path="/teams" element={
      <ProtectedRoute>
        <BaseLayout>
          <TeamsDashboard />
        </BaseLayout>
      </ProtectedRoute>
    } />
    <Route path="/teams/:teamId" element={
      <ProtectedRoute>
        <BaseLayout>
          <TeamWorkspace />
        </BaseLayout>
      </ProtectedRoute>
    } />
    
    {/* Investigation Management Routes */}
    <Route path="/investigations" element={
      <ProtectedRoute>
        <BaseLayout>
          <InvestigationsDashboard />
        </BaseLayout>
      </ProtectedRoute>
    } />
    <Route path="/investigations/:investigationId" element={
      <ProtectedRoute>
        <BaseLayout>
          <CyberInvestigationMVP />
        </BaseLayout>
      </ProtectedRoute>
    } />
    
    {/* Intel Management Routes */}
    <Route path="/intel" element={
      <ProtectedRoute>
        <BaseLayout>
          <IntelDashboard />
        </BaseLayout>
      </ProtectedRoute>
    } />
    <Route path="/intel/:reportId" element={
      <ProtectedRoute>
        <BaseLayout>
          <IntelReportsPage />
        </BaseLayout>
      </ProtectedRoute>
    } />
    
    {/* Report creation for team intel */}
    <Route path="/team/:teamId/new-report" element={
      <ProtectedRoute>
        <BaseLayout>
          <NewReportPage />
        </BaseLayout>
      </ProtectedRoute>
    } />
    
    {/* Existing routes */}
    <Route path="/settings" element={
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    } />
    <Route path="/intelreports" element={
      <ProtectedRoute>
        <IntelReportsPage />
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
    
    {/* Demo and test routes */}
    <Route path="/auth-demo" element={<AuthDemoPage />} />
    <Route path="/ipfs-nostr-demo" element={<IPFSNostrIntegrationDemo />} />
    <Route path="/chat-demo" element={<ChatDemoPage />} />
    <Route path="/test-ui" element={<UXFlowIntegrationTest />} />
    <Route path="/ux-test" element={<UXFlowIntegrationTest />} />
  </Routes>
);

export default AppRoutes;