import React from 'react';
import GlobeComponent from '../../components/Globe/GlobeComponent';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>3D Globe Dashboard</h1>
      <GlobeComponent />
    </div>
  );
};

export default Dashboard;