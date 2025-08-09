import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import consolidated applications
import NetRunnerApplication from './netrunner/NetRunnerApplication';
import IntelAnalyzerApplication from './intelanalyzer/IntelAnalyzerApplication';
import TimeMapApplication from './timemap/TimeMapApplication';
import TeamWorkspaceApplication from './teamworkspace/TeamWorkspaceApplication';
import MarketExchangeApplication from './marketexchange/MarketExchangeApplication';

/**
 * Application Router for consolidated applications
 * 
 * This router handles the new consolidated application structure
 * while maintaining compatibility with the existing MainPage routing system
 */
const ApplicationRouter: React.FC = () => {
  return (
    <Routes>
      {/* NetRunner - Consolidated OSINT, AI Agent, Bot Roster, Power Tools */}
      <Route path="/netrunner/*" element={<NetRunnerApplication />} />
      
      {/* IntelAnalyzer - Consolidated Intelligence Analysis and Reports */}
      <Route path="/intelanalyzer/*" element={<IntelAnalyzerApplication />} />
      
      {/* TimeMap - Enhanced timeline with monitoring integration */}
      <Route path="/timemap/*" element={<TimeMapApplication />} />
      
      {/* NodeWeb legacy route redirect */}
      <Route path="/nodeweb/*" element={<Navigate to="/intelweb" replace />} />
      
      {/* TeamWorkspace - Collaborative workspace and team coordination */}
      <Route path="/teamworkspace/*" element={<TeamWorkspaceApplication />} />
      
      {/* MarketExchange - Intelligence trading and marketplace */}
      <Route path="/marketexchange/*" element={<MarketExchangeApplication />} />
      
      {/* Fallback route */}
      <Route path="*" element={
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#00ff00',
          fontFamily: 'monospace'
        }}>
          <div>
            <h2>Application Not Found</h2>
            <p>The requested application could not be found.</p>
            <p>Available applications: NetRunner, IntelAnalyzer, TimeMap, NodeWeb, TeamWorkspace, MarketExchange</p>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default ApplicationRouter;
