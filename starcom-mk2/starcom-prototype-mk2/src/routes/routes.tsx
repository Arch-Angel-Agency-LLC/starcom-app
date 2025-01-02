import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Remove BrowserRouter import
import Dashboard from '../pages/Dashboard/Dashboard';
import UserSettings from '../pages/Settings/UserSettings';
import FilterSettings from '../pages/Settings/FilterSettings';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/settings" element={<UserSettings />} />
    <Route path="/filters" element={<FilterSettings />} />
  </Routes>
);

export default AppRoutes;