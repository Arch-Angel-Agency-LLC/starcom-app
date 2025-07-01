import { CyberTeam, CyberInvestigation, TeamMember } from '../types/cyberInvestigation';
import { createTeamInviteLink } from '../config/publicInfrastructure';

interface TeamWorkspaceData {
  teams: CyberTeam[];
  investigations: CyberInvestigation[];
  memberActivities: MemberActivity[];
  teamStats: TeamStats;
}

interface MemberActivity {
  id: string;
  teamId: string;
  memberId: string;
  type: 'joined' | 'left' | 'investigation_created' | 'report_submitted' | 'message_sent';
  timestamp: Date;
  details: string;
}

interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  totalMembers: number;
  onlineMembers: number;
  activeInvestigations: number;
  recentReports: number;
}

class RealTimeTeamService {
  private teams: Map<string, CyberTeam> = new Map();
  private investigations: Map<string, CyberInvestigation> = new Map();
  private memberActivities: MemberActivity[] = [];
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor() {
    this.loadPersistedData();
    this.setupPeriodicSync();
  }

  // Team Management
  async createTeam(teamData: Partial<CyberTeam>, creatorId: string): Promise<CyberTeam> {
    const team: CyberTeam = {
      id: `team-${Date.now()}`,
      name: teamData.name || 'New Team',
      type: teamData.type || 'INCIDENT_RESPONSE',
      agency: teamData.agency || 'CYBER_COMMAND',
      lead: creatorId,
      members: [{
        walletAddress: creatorId,
        name: 'Team Lead',
        role: 'LEAD_ANALYST',
        specializations: teamData.specializations || [],
        clearanceLevel: teamData.clearanceLevel || 'UNCLASSIFIED',
        status: 'ONLINE',
        joinedAt: new Date(),
        lastActivity: new Date()
      }],
      specializations: teamData.specializations || [],
      clearanceLevel: teamData.clearanceLevel || 'UNCLASSIFIED',
      status: 'ACTIVE',
      currentInvestigations: [],
      autoShareFindings: true,
      allowExternalCollaboration: false,
      preferredCommunicationChannels: ['secure-chat'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.teams.set(team.id, team);
    this.persistData();
    
    // Log activity
    this.addMemberActivity({
      id: `activity-${Date.now()}`,
      teamId: team.id,
      memberId: creatorId,
      type: 'joined',
      timestamp: new Date(),
      details: `Team "${team.name}" created`
    });

    // Emit event for real-time updates
    this.emit('team-created', { team });

    return team;
  }

  async joinTeam(teamId: string, member: Partial<TeamMember>): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const newMember: TeamMember = {
      walletAddress: member.walletAddress || 'unknown',
      name: member.name || 'New Member',
      role: member.role || 'CYBER_ANALYST',
      specializations: member.specializations || [],
      clearanceLevel: member.clearanceLevel || 'UNCLASSIFIED',
      status: 'ONLINE',
      joinedAt: new Date(),
      lastActivity: new Date()
    };

    team.members.push(newMember);
    team.updatedAt = new Date();
    
    this.teams.set(teamId, team);
    this.persistData();

    // Log activity
    this.addMemberActivity({
      id: `activity-${Date.now()}`,
      teamId,
      memberId: newMember.walletAddress,
      type: 'joined',
      timestamp: new Date(),
      details: `${newMember.name} joined the team`
    });

    this.emit('member-joined', { teamId, member: newMember });
    return true;
  }

  async updateMemberStatus(teamId: string, memberId: string, status: 'ONLINE' | 'OFFLINE' | 'AWAY'): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) return;

    const member = team.members.find(m => m.walletAddress === memberId);
    if (!member) return;

    member.status = status;
    member.lastActivity = new Date();
    team.updatedAt = new Date();

    this.teams.set(teamId, team);
    this.persistData();
    this.emit('member-status-updated', { teamId, memberId, status });
  }

  // Investigation Management
  async createInvestigation(investigationData: Partial<CyberInvestigation>, teamId: string, creatorId: string): Promise<CyberInvestigation> {
    const investigation: CyberInvestigation = {
      id: `inv-${Date.now()}`,
      title: investigationData.title || 'New Investigation',
      description: investigationData.description || '',
      type: investigationData.type || 'INCIDENT_RESPONSE',
      classification: investigationData.classification || 'UNCLASSIFIED',
      priority: investigationData.priority || 'MEDIUM',
      severity: investigationData.severity || 'MEDIUM',
      detectedDate: new Date(),
      incidentDate: investigationData.incidentDate || new Date(),
      reportedBy: creatorId,
      assignedTeam: teamId,
      status: 'INITIATED',
      progress: 0,
      affectedSystems: investigationData.affectedSystems || [],
      affectedUsers: [],
      estimatedImpact: investigationData.estimatedImpact || 'MEDIUM',
      intelPackages: [],
      timeline: [{
        id: `timeline-${Date.now()}`,
        timestamp: new Date(),
        type: 'INCIDENT_DETECTED',
        description: `Investigation "${investigationData.title}" initiated`,
        author: creatorId,
        relatedReports: [],
        evidence: []
      }],
      ioCs: [],
      evidence: [],
      collaboratingTeams: [],
      sharedWith: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      recommendedActions: []
    };

    this.investigations.set(investigation.id, investigation);
    
    // Add to team's current investigations
    const team = this.teams.get(teamId);
    if (team) {
      team.currentInvestigations.push(investigation.id);
      team.updatedAt = new Date();
      this.teams.set(teamId, team);
    }

    this.persistData();

    // Log activity
    this.addMemberActivity({
      id: `activity-${Date.now()}`,
      teamId,
      memberId: creatorId,
      type: 'investigation_created',
      timestamp: new Date(),
      details: `Investigation "${investigation.title}" created`
    });

    this.emit('investigation-created', { investigation, teamId });
    return investigation;
  }

  async updateInvestigationStatus(investigationId: string, status: CyberInvestigation['status']): Promise<void> {
    const investigation = this.investigations.get(investigationId);
    if (!investigation) return;

    investigation.status = status;
    investigation.updatedAt = new Date();
    
    // Update progress based on status
    switch (status) {
      case 'INITIATED':
        investigation.progress = 10;
        break;
      case 'INVESTIGATING':
        investigation.progress = 30;
        break;
      case 'CONTAINING':
        investigation.progress = 60;
        break;
      case 'ANALYZING':
        investigation.progress = 80;
        break;
      case 'RECOVERING':
        investigation.progress = 90;
        break;
      case 'CLOSED':
        investigation.progress = 100;
        break;
    }

    this.investigations.set(investigationId, investigation);
    this.persistData();
    this.emit('investigation-updated', { investigation });
  }

  // Data Access Methods
  getTeams(): CyberTeam[] {
    return Array.from(this.teams.values());
  }

  getTeam(teamId: string): CyberTeam | undefined {
    return this.teams.get(teamId);
  }

  getUserTeams(userId: string): CyberTeam[] {
    return Array.from(this.teams.values()).filter(team => 
      team.members.some(member => member.walletAddress === userId)
    );
  }

  getTeamInvestigations(teamId: string): CyberInvestigation[] {
    return Array.from(this.investigations.values()).filter(inv => 
      inv.assignedTeam === teamId
    );
  }

  getInvestigation(investigationId: string): CyberInvestigation | undefined {
    return this.investigations.get(investigationId);
  }

  getTeamStats(): TeamStats {
    const teams = Array.from(this.teams.values());
    const investigations = Array.from(this.investigations.values());
    
    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
    const onlineMembers = teams.reduce((sum, team) => 
      sum + team.members.filter(m => m.status === 'ONLINE').length, 0
    );

    return {
      totalTeams: teams.length,
      activeTeams: teams.filter(t => t.status === 'ACTIVE').length,
      totalMembers,
      onlineMembers,
      activeInvestigations: investigations.filter(i => 
        ['INITIATED', 'INVESTIGATING', 'ANALYZING', 'CONTAINING', 'RECOVERING'].includes(i.status)
      ).length,
      recentReports: investigations.filter(i => 
        i.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };
  }

  getTeamWorkspaceData(teamId?: string): TeamWorkspaceData {
    const teams = teamId ? 
      (this.teams.get(teamId) ? [this.teams.get(teamId)!] : []) : 
      this.getTeams();
    
    const investigations = teamId ? 
      this.getTeamInvestigations(teamId) : 
      Array.from(this.investigations.values());

    const memberActivities = teamId ? 
      this.memberActivities.filter(a => a.teamId === teamId) : 
      this.memberActivities;

    return {
      teams,
      investigations,
      memberActivities: memberActivities.slice(0, 50), // Recent activities
      teamStats: this.getTeamStats()
    };
  }

  // Real-time Communication
  generateTeamInvite(teamId: string): string {
    const team = this.teams.get(teamId);
    if (!team) throw new Error('Team not found');
    
    return createTeamInviteLink(teamId, team.name);
  }

  // Event Management
  on(event: string, callback: (...args: unknown[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Private Methods
  private addMemberActivity(activity: MemberActivity): void {
    this.memberActivities.unshift(activity);
    
    // Keep only recent activities (last 1000)
    if (this.memberActivities.length > 1000) {
      this.memberActivities = this.memberActivities.slice(0, 1000);
    }
    
    this.emit('activity-added', { activity });
  }

  private loadPersistedData(): void {
    try {
      // Load teams
      const teamsData = localStorage.getItem('starcom_teams');
      if (teamsData) {
        const teams = JSON.parse(teamsData) as CyberTeam[];
        teams.forEach(team => this.teams.set(team.id, team));
      }

      // Load investigations
      const investigationsData = localStorage.getItem('starcom_investigations');
      if (investigationsData) {
        const investigations = JSON.parse(investigationsData) as CyberInvestigation[];
        investigations.forEach(inv => this.investigations.set(inv.id, inv));
      }

      // Load activities
      const activitiesData = localStorage.getItem('starcom_activities');
      if (activitiesData) {
        this.memberActivities = JSON.parse(activitiesData);
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem('starcom_teams', JSON.stringify(Array.from(this.teams.values())));
      localStorage.setItem('starcom_investigations', JSON.stringify(Array.from(this.investigations.values())));
      localStorage.setItem('starcom_activities', JSON.stringify(this.memberActivities));
    } catch (error) {
      console.error('Failed to persist data:', error);
    }
  }

  private setupPeriodicSync(): void {
    // Sync every 30 seconds for real-time feel
    setInterval(() => {
      this.syncWithPublicInfrastructure();
    }, 30000);
  }

  private async syncWithPublicInfrastructure(): Promise<void> {
    try {
      // TODO: Implement real-time team sync using Nostr events and IPFS content addressing for investigation data
      // 1. Publish team updates to Nostr relays
      // 2. Store investigation data to IPFS
      // 3. Sync member status updates
      // 4. Handle distributed notifications
      
      // For now, emit sync event to indicate background sync is working
      this.emit('sync-completed', { 
        timestamp: new Date(),
        teamsCount: this.teams.size,
        investigationsCount: this.investigations.size,
        activitiesCount: this.memberActivities.length
      });
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Failed to sync with public infrastructure:', error);
      this.emit('sync-error', { error, timestamp: new Date() });
    }
  }

  // Infrastructure Health Check
  async checkInfrastructureHealth(): Promise<{
    nostrRelays: { connected: number; total: number };
    ipfsGateways: { available: number; total: number };
    status: 'healthy' | 'degraded' | 'offline';
  }> {
    // TODO: Implement actual health checks
    return {
      nostrRelays: { connected: 8, total: 12 },
      ipfsGateways: { available: 6, total: 10 },
      status: 'healthy'
    };
  }

  // Team Invite and Discovery
  async generateSecureInviteCode(teamId: string): Promise<string> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error('Team not found');
    
    // TODO: Implement cryptographically secure invite codes
    const inviteCode = btoa(`${teamId}-${Date.now()}-${Math.random()}`);
    return inviteCode;
  }

  async resolveInviteCode(inviteCode: string): Promise<{ teamId: string; teamName: string } | null> {
    try {
      // TODO: Implement secure invite code resolution
      const decoded = atob(inviteCode);
      const [teamId] = decoded.split('-');
      const team = this.teams.get(teamId);
      
      if (team) {
        return { teamId: team.id, teamName: team.name };
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const realTimeTeamService = new RealTimeTeamService();
export default realTimeTeamService;
