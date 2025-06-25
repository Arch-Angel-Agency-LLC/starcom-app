// Local Storage Service for Cyber Investigation MVP
// Provides persistence for teams, intel packages, and investigations

import { CyberTeam, IntelPackage, CyberInvestigation } from '../types/cyberInvestigation';

const STORAGE_KEYS = {
  TEAMS: 'starcom_cyber_teams',
  PACKAGES: 'starcom_intel_packages',
  INVESTIGATIONS: 'starcom_cyber_investigations'
} as const;

// Types for serialized data
interface SerializedTeam extends Omit<CyberTeam, 'createdAt' | 'updatedAt' | 'members'> {
  createdAt: string;
  updatedAt: string;
  members: Array<Omit<CyberTeam['members'][0], 'joinedAt'> & { joinedAt: string }>;
}

interface SerializedPackage extends Omit<IntelPackage, 'createdAt' | 'updatedAt' | 'incidentDate'> {
  createdAt: string;
  updatedAt: string;
  incidentDate?: string;
}

interface SerializedInvestigation extends Omit<CyberInvestigation, 'createdAt' | 'updatedAt' | 'incidentDate' | 'timeline'> {
  createdAt: string;
  updatedAt: string;
  incidentDate: string;
  timeline?: Array<Omit<CyberInvestigation['timeline'][0], 'timestamp'> & { timestamp: string }>;
}

export class CyberInvestigationStorage {
  // Teams Management
  static saveTeams(teams: CyberTeam[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    } catch (error) {
      console.error('Failed to save teams:', error);
    }
  }

  static loadTeams(): CyberTeam[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (data) {
        const teams: SerializedTeam[] = JSON.parse(data);
        // Convert date strings back to Date objects
        return teams.map((team) => ({
          ...team,
          createdAt: new Date(team.createdAt),
          updatedAt: new Date(team.updatedAt),
          members: team.members.map((member) => ({
            ...member,
            joinedAt: new Date(member.joinedAt)
          }))
        }));
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
    return [];
  }

  static addTeam(team: CyberTeam): void {
    const teams = this.loadTeams();
    teams.push(team);
    this.saveTeams(teams);
  }

  static updateTeam(teamId: string, updates: Partial<CyberTeam>): void {
    const teams = this.loadTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index >= 0) {
      teams[index] = { ...teams[index], ...updates, updatedAt: new Date() };
      this.saveTeams(teams);
    }
  }

  static deleteTeam(teamId: string): void {
    const teams = this.loadTeams().filter(t => t.id !== teamId);
    this.saveTeams(teams);
  }

  // Intel Packages Management
  static savePackages(packages: IntelPackage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
    } catch (error) {
      console.error('Failed to save packages:', error);
    }
  }

  static loadPackages(): IntelPackage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      if (data) {
        const packages: SerializedPackage[] = JSON.parse(data);
        // Convert date strings back to Date objects
        return packages.map((pkg) => ({
          ...pkg,
          createdAt: new Date(pkg.createdAt),
          updatedAt: new Date(pkg.updatedAt),
          incidentDate: pkg.incidentDate ? new Date(pkg.incidentDate) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
    return [];
  }

  static addPackage(package_: IntelPackage): void {
    const packages = this.loadPackages();
    packages.push(package_);
    this.savePackages(packages);
  }

  static updatePackage(packageId: string, updates: Partial<IntelPackage>): void {
    const packages = this.loadPackages();
    const index = packages.findIndex(p => p.id === packageId);
    if (index >= 0) {
      packages[index] = { ...packages[index], ...updates, updatedAt: new Date() };
      this.savePackages(packages);
    }
  }

  static deletePackage(packageId: string): void {
    const packages = this.loadPackages().filter(p => p.id !== packageId);
    this.savePackages(packages);
  }

  // Investigations Management
  static saveInvestigations(investigations: CyberInvestigation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(investigations));
    } catch (error) {
      console.error('Failed to save investigations:', error);
    }
  }

  static loadInvestigations(): CyberInvestigation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVESTIGATIONS);
      if (data) {
        const investigations: SerializedInvestigation[] = JSON.parse(data);
        // Convert date strings back to Date objects
        return investigations.map((inv) => ({
          ...inv,
          createdAt: new Date(inv.createdAt),
          updatedAt: new Date(inv.updatedAt),
          incidentDate: new Date(inv.incidentDate),
          timeline: inv.timeline?.map((event) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          })) || []
        }));
      }
    } catch (error) {
      console.error('Failed to load investigations:', error);
    }
    return [];
  }

  static addInvestigation(investigation: CyberInvestigation): void {
    const investigations = this.loadInvestigations();
    investigations.push(investigation);
    this.saveInvestigations(investigations);
  }

  static updateInvestigation(investigationId: string, updates: Partial<CyberInvestigation>): void {
    const investigations = this.loadInvestigations();
    const index = investigations.findIndex(i => i.id === investigationId);
    if (index >= 0) {
      investigations[index] = { ...investigations[index], ...updates, updatedAt: new Date() };
      this.saveInvestigations(investigations);
    }
  }

  static deleteInvestigation(investigationId: string): void {
    const investigations = this.loadInvestigations().filter(i => i.id !== investigationId);
    this.saveInvestigations(investigations);
  }

  // Utility methods
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TEAMS);
      localStorage.removeItem(STORAGE_KEYS.PACKAGES);
      localStorage.removeItem(STORAGE_KEYS.INVESTIGATIONS);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  static exportData(): string {
    const data = {
      teams: this.loadTeams(),
      packages: this.loadPackages(),
      investigations: this.loadInvestigations(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      if (data.teams) this.saveTeams(data.teams);
      if (data.packages) this.savePackages(data.packages);
      if (data.investigations) this.saveInvestigations(data.investigations);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

export default CyberInvestigationStorage;
