import React from 'react';
import ConflictList from '../../components/Conflict/ConflictList'; // Adjust import path as needed
import { useFetchConflicts } from '../../hooks/data/useFetchConflicts';

const ConflictDashboard: React.FC = () => {
  const { data, loading, error } = useFetchConflicts({}, 1);

  return (
    <div>
      <h1>Conflict Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data && <ConflictList conflicts={data.Result} />} {/* Use Result property */}
    </div>
  );
};

export default ConflictDashboard;