interface CyberTeamLocal {
  id: string;
  name: string;
  members: string[];
}

export class AnchorService {
  private TEAMS_KEY = 'starcom_teams';

  private readTeams(): CyberTeamLocal[] {
    const data = localStorage.getItem(this.TEAMS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private writeTeams(teams: CyberTeamLocal[]) {
    localStorage.setItem(this.TEAMS_KEY, JSON.stringify(teams));
  }

  async getUserTeams(): Promise<CyberTeamLocal[]> {
    // Return all teams (filtering by membership can be handled in hook)
    return this.readTeams();
  }

  async createCyberTeam(name: string): Promise<string> {
    const teams = this.readTeams();
    const id = crypto.randomUUID();
    const newTeam: CyberTeamLocal = { id, name, members: [] };
    teams.push(newTeam);
    this.writeTeams(teams);
    return id;
  }

  async addTeamMember(teamId: string, member: string): Promise<void> {
    const teams = this.readTeams();
    const team = teams.find(t => t.id === teamId);
    if (team && !team.members.includes(member)) {
      team.members.push(member);
      this.writeTeams(teams);
    }
  }

  async removeTeamMember(teamId: string, member: string): Promise<void> {
    const teams = this.readTeams();
    const team = teams.find(t => t.id === teamId);
    if (team) {
      team.members = team.members.filter(m => m !== member);
      this.writeTeams(teams);
    }
  }

  /** Create an Intel Report stub locally and return a unique ID */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createIntelReport(_report?: unknown, _authorWallet?: unknown): Promise<string> {
    return Promise.resolve(Date.now().toString());
  }
}

export const anchorService = new AnchorService();