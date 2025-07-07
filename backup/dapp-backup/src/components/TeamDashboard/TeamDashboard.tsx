import React from 'react';
import { CyberTeam } from '../../context/TeamContext';

interface TeamDashboardProps {
  teams: CyberTeam[];
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ teams }) => {
  if (!teams || teams.length === 0) {
    return <div>No teams</div>;
  }
  return (
    <div>
      {teams.map(team => (
        <div key={team.id} className="team-card">
          <h3>{team.name}</h3>
          <p>Members: {team.members.length}</p>
        </div>
      ))}
    </div>
  );
};

export default TeamDashboard;
