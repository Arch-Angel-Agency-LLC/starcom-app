import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainPage from '../pages/MainPage/MainPage';
import ProtectedRoute from './ProtectedRoute';
import TokenGatedPage from '../components/Auth/TokenGatedPage';
import AuthDemoPage from '../components/Demo/AuthDemoPage';
import UXFlowIntegrationTest from '../components/Testing/UXFlowIntegrationTest';
import CyberInvestigationMVP from '../components/CyberInvestigation/CyberInvestigationMVP';
import IPFSNostrIntegrationDemo from '../components/Demo/IPFSNostrIntegrationDemo';
import ChatDemoPage from '../pages/Demo/ChatDemoPage';
import EnhancedApplicationDemo from '../pages/Demo/EnhancedApplicationDemo';

// Standalone page imports
import TeamWorkspace from '../pages/Teams/TeamWorkspace';
import InvestigationsDashboard from '../pages/Investigations/InvestigationsDashboard';
import IntelDashboard from '../pages/Intel/IntelDashboard';
import NewReportPage from '../pages/Reports/NewReportPage';

// Layout imports
import BaseLayout from '../layouts/BaseLayout/BaseLayout';

/**
 * Main routing component for the application
 * 
 * We use a nested route structure to handle the main application screens:
 * - The parent route (/) renders MainPage which contains the navigation and layout
 * - Each child route represents a specific screen within MainPage
 * - The RouteSynchronizer component ensures URL routes and ViewContext stay in sync
 */
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Main Application Routes - Using nested routes for better organization */}
    <Route path="/" element={<MainPage />}>
      {/* Default screen (Globe) */}
      <Route index element={null} /> {/* Empty element - MainPage handles the actual rendering */}
      
      {/* Main screens with support for parameters */}
      <Route path="search" element={null} />
      <Route path="search/:searchQuery" element={null} />
      <Route path="netrunner" element={null} />
      <Route path="netrunner/:searchQuery" element={null} />
      <Route path="intelanalyzer" element={null} />
      <Route path="marketexchange" element={null} />
      <Route path="monitoring" element={null} />
      <Route path="nodeweb" element={null} />
      <Route path="nodeweb/:nodeId" element={null} />
      <Route path="timeline" element={null} />
      <Route path="timeline/:timeframeId" element={null} />
      <Route path="cases" element={null} />
      <Route path="cases/:caseId" element={null} />
      <Route path="teams" element={null} />
      <Route path="teams/:teamId" element={null} />
      <Route path="aiagent" element={null} />
      <Route path="bots" element={null} />
      <Route path="bots/:botId" element={null} />
    </Route>
    
    {/* Legacy and Standalone Routes - These use their own components */}
    <Route path="/team/:teamId" element={
      <ProtectedRoute>
        <BaseLayout>
          <TeamWorkspace />
        </BaseLayout>
      </ProtectedRoute>
    } />
    
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
    
    <Route path="/intel" element={
      <ProtectedRoute>
        <BaseLayout>
          <IntelDashboard />
        </BaseLayout>
      </ProtectedRoute>
    } />
    
    <Route path="/team/:teamId/new-report" element={
      <ProtectedRoute>
        <BaseLayout>
          <NewReportPage />
        </BaseLayout>
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
    <Route path="/enhanced-app-demo" element={<EnhancedApplicationDemo />} />
    <Route path="/ipfs-nostr-demo" element={<IPFSNostrIntegrationDemo />} />
    <Route path="/chat-demo" element={<ChatDemoPage />} />
    <Route path="/test-ui" element={<UXFlowIntegrationTest />} />
    <Route path="/ux-test" element={<UXFlowIntegrationTest />} />
    
    {/* Catch-all route - redirect to home */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
