// Local Storage Service for Cyber Investigation MVP
// Provides persistence for teams, intel packages, and investigations

import { CyberTeam, IntelPackage, Cyber  static async addInvestigation(investigation: CyberInvestigation): Promise<void> {
    const investigations = await this.loadInvestigations();
    investigations.push(investigation);
    await this.saveInvestigations(investigations);
  }

  static async updateInvestigation(investigationId: string, updates: Partial<CyberInvestigation>): Promise<void> {
    const investigations = await this.loadInvestigations();
    const index = investigations.findIndex(i => i.id === investigationId);
    if (index >= 0) {
      investigations[index] = { ...investigations[index], ...updates, updatedAt: new Date() };
      await this.saveInvestigations(investigations);
    }
  }

  static async deleteInvestigation(investigationId: string): Promise<void> {
    const investigations = await this.loadInvestigations();
    const filteredInvestigations = investigations.filter(i => i.id !== investigationId);
    await this.saveInvestigations(filteredInvestigations);
  }m '../types/cyberInvestigation';
import { secureStorage } from '../security/storage/SecureStorageManager';

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
  static async saveTeams(teams: CyberTeam[]): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.TEAMS, teams);
    } catch {
      // Silent failure for production security
    }
  }

  static async loadTeams(): Promise<CyberTeam[]> {
    try {
      const teams = await secureStorage.getItem<SerializedTeam[]>(STORAGE_KEYS.TEAMS);
      if (teams) {
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
    } catch {
      // Silent failure for production security
    }
    return [];
  }

  static async addTeam(team: CyberTeam): Promise<void> {
    const teams = await this.loadTeams();
    teams.push(team);
    await this.saveTeams(teams);
  }

  static async updateTeam(teamId: string, updates: Partial<CyberTeam>): Promise<void> {
    const teams = await this.loadTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index >= 0) {
      teams[index] = { ...teams[index], ...updates, updatedAt: new Date() };
      await this.saveTeams(teams);
    }
  }

  static async deleteTeam(teamId: string): Promise<void> {
    const teams = await this.loadTeams();
    const filteredTeams = teams.filter(t => t.id !== teamId);
    await this.saveTeams(filteredTeams);
  }

  // Intel Packages Management
  static async savePackages(packages: IntelPackage[]): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.PACKAGES, packages);
    } catch {
      // Silent failure for production security
    }
  }

  static async loadPackages(): Promise<IntelPackage[]> {
    try {
      const packages = await secureStorage.getItem<SerializedPackage[]>(STORAGE_KEYS.PACKAGES);
      if (packages) {
        // Convert date strings back to Date objects
        return packages.map((pkg) => ({
          ...pkg,
          createdAt: new Date(pkg.createdAt),
          updatedAt: new Date(pkg.updatedAt),
          incidentDate: pkg.incidentDate ? new Date(pkg.incidentDate) : undefined
        }));
      }
    } catch {
      // Silent failure for production security
    }
    return [];
  }

  static async addPackage(package_: IntelPackage): Promise<void> {
    const packages = await this.loadPackages();
    packages.push(package_);
    await this.savePackages(packages);
  }

  static async updatePackage(packageId: string, updates: Partial<IntelPackage>): Promise<void> {
    const packages = await this.loadPackages();
    const index = packages.findIndex(p => p.id === packageId);
    if (index >= 0) {
      packages[index] = { ...packages[index], ...updates, updatedAt: new Date() };
      await this.savePackages(packages);
    }
  }

  static async deletePackage(packageId: string): Promise<void> {
    const packages = await this.loadPackages();
    const filteredPackages = packages.filter(p => p.id !== packageId);
    await this.savePackages(filteredPackages);
  }

  // Investigations Management
  static async saveInvestigations(investigations: CyberInvestigation[]): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, investigations);
    } catch {
      // Silent failure for production security
    }
  }

  static async loadInvestigations(): Promise<CyberInvestigation[]> {
    try {
      const investigations = await secureStorage.getItem<SerializedInvestigation[]>(STORAGE_KEYS.INVESTIGATIONS);
      if (investigations) {
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
    } catch {
      // Silent failure for production security
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
      secureStorage.removeItem(STORAGE_KEYS.TEAMS);
      secureStorage.removeItem(STORAGE_KEYS.PACKAGES);
      secureStorage.removeItem(STORAGE_KEYS.INVESTIGATIONS);
    } catch {
      // Silent failure for production security
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
    } catch {
      // Silent failure for production security
      return false;
    }
  }
}

export default CyberInvestigationStorage;
