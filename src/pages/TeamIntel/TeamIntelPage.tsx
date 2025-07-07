import React from 'react';
import { useParams } from 'react-router-dom';
import { useTeamContext } from '../../context/TeamContext';

const TeamIntelPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { teams, loading, error } = useTeamContext();

  if (loading) return <div>Loading intel...</div>;
  if (error) return <div>Error: {error.message}</div>;
  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return <div>Access denied: You are not a member of this team.</div>;
  }

  // Placeholder for intel list
  return (
    <div>
      <h2>Intel Reports for {team.name}</h2>
      <div>No reports available.</div>
    </div>
  );
};

export default TeamIntelPage;
