import React from 'react';
import { TimeDataProvider } from './context/TimeDataProvider';
import MainPage from './pages/MainPage/MainPage';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <TimeDataProvider>
      <MainPage />
    </TimeDataProvider>
  );
};

export default App;