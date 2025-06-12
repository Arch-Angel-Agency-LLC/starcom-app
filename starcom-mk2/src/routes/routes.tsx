import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage/MainPage';
import SettingsPage from '../pages/SettingsPage/SettingsPage';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/intelreports" element={<SettingsPage />} />
  </Routes>
);

export default AppRoutes;