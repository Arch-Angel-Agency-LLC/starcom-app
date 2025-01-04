import React from 'react';
import { TimeDataProvider } from './context/TimeDataProvider';
import GlobeComponent from './components/Globe/GlobeComponent';

const App: React.FC = () => {
  return (
    <TimeDataProvider>
      <GlobeComponent />
    </TimeDataProvider>
  );
};

export default App;