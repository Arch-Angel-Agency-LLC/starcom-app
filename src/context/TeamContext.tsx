import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { anchorService } from '../services/anchor/AnchorService';

export interface CyberTeam {
  id: string;
  name: string;
  members: string[]; // wallet addresses
}

interface TeamContextValue {
  teams: CyberTeam[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<CyberTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const result = await anchorService.getUserTeams();
      setTeams(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <TeamContext.Provider value={{ teams, loading, error, refresh: fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeamContext = (): TeamContextValue => {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error('useTeamContext must be used within TeamProvider');
  }
  return ctx;
};
