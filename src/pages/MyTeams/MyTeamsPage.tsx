import React, { useState } from 'react';
import { useTeamContext, CyberTeam } from '../../context/TeamContext';
import { anchorService } from '../../services/anchor/AnchorService';

const MyTeamsPage: React.FC = () => {
  const { teams, loading, error, refresh } = useTeamContext();
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await anchorService.createCyberTeam(newName.trim());
      setNewName('');
      await refresh();
    } catch (e) {
      console.error('Failed to create team:', e);
    }
  };

  return (
    <div className="my-teams-page">
      <h2>My Teams</h2>
      {loading && <p>Loading teams...</p>}
      {error && <p>Error: {error.message}</p>}
      {!loading && !error && (
        <ul>
          {teams.map((team: CyberTeam) => (
            <li key={team.id}>{team.name} ({team.members.length} members)</li>
          ))}
          {teams.length === 0 && <li>No teams found.</li>}
        </ul>
      )}
      <div className="create-team">
        <input
          type="text"
          placeholder="New team name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button onClick={handleCreate}>Create Team</button>
      </div>
    </div>
  );
};

export default MyTeamsPage;
