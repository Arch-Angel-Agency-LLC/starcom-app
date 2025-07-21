/**
 * Unit tests for CyberAttacks types and validation
 * Testing specialized CyberAttack data structures and validation functions
 */

import { describe, test, expect } from 'vitest';

import {
  AttackType,
  SeverityLevel,
  AttackStatus,
  CyberAttackData,
  AttackSource,
  AttackTarget,
  AttackTrajectory,
  isValidAttackType,
  isValidSeverityLevel,
  isValidAttackStatus,
  validateCyberAttackData,
  ATTACK_TYPE_COLORS,
  SEVERITY_COLORS,
  SECTOR_COLORS,
  CYBER_ATTACK_CONSTANTS
} from '../CyberAttacks';

describe('CyberAttacks Types', () => {

  // =============================================================================
  // TYPE VALIDATION TESTS
  // =============================================================================

  describe('Type Guard Functions', () => {
    describe('isValidAttackType', () => {
      test('should validate correct attack types', () => {
        const validTypes: AttackType[] = [
          'DDoS', 'Malware', 'Phishing', 'DataBreach', 'Ransomware',
          'APT', 'Botnet', 'WebAttack', 'NetworkIntrusion', 'Unknown'
        ];

        validTypes.forEach(type => {
          expect(isValidAttackType(type)).toBe(true);
        });
      });

      test('should reject invalid attack types', () => {
        const invalidTypes = [
          'InvalidType', 'ddos', 'MALWARE', '', 'SQL_Injection', 'XSS'
        ];

        invalidTypes.forEach(type => {
          expect(isValidAttackType(type)).toBe(false);
        });
      });
    });

    describe('isValidSeverityLevel', () => {
      test('should validate correct severity levels', () => {
        const validLevels: SeverityLevel[] = [1, 2, 3, 4, 5];

        validLevels.forEach(level => {
          expect(isValidSeverityLevel(level)).toBe(true);
        });
      });

      test('should reject invalid severity levels', () => {
        const invalidLevels = [0, 6, -1, 1.5, 'high', null, undefined];

        invalidLevels.forEach(level => {
          expect(isValidSeverityLevel(level as number)).toBe(false);
        });
      });
    });

    describe('isValidAttackStatus', () => {
      test('should validate correct attack statuses', () => {
        const validStatuses: AttackStatus[] = [
          'detected', 'in_progress', 'contained', 'mitigated', 'resolved', 'escalated'
        ];

        validStatuses.forEach(status => {
          expect(isValidAttackStatus(status)).toBe(true);
        });
      });

      test('should reject invalid attack statuses', () => {
        const invalidStatuses = [
          'active', 'inactive', 'pending', 'DETECTED', '', 'unknown'
        ];

        invalidStatuses.forEach(status => {
          expect(isValidAttackStatus(status)).toBe(false);
        });
      });
    });
  });

  // =============================================================================
  // DATA STRUCTURE TESTS
  // =============================================================================

  describe('Data Structure Interfaces', () => {
    test('should create valid AttackSource', () => {
      const source: AttackSource = {
        latitude: 40.7128,
        longitude: -74.0060,
        countryCode: 'US',
        city: 'New York',
        organization: 'Evil Corp',
        asn: 12345,
        confidence: 0.85
      };

      expect(source.latitude).toBe(40.7128);
      expect(source.longitude).toBe(-74.0060);
      expect(source.countryCode).toBe('US');
      expect(source.confidence).toBe(0.85);
    });

    test('should create valid AttackTarget', () => {
      const target: AttackTarget = {
        latitude: 51.5074,
        longitude: -0.1278,
        countryCode: 'GB',
        city: 'London',
        organization: 'Government Agency',
        sector: 'Government',
        criticality: 0.95
      };

      expect(target.latitude).toBe(51.5074);
      expect(target.longitude).toBe(-0.1278);
      expect(target.sector).toBe('Government');
      expect(target.criticality).toBe(0.95);
    });

    test('should create valid AttackTrajectory', () => {
      const trajectory: AttackTrajectory = {
        source: {
          latitude: 40.7128,
          longitude: -74.0060,
          countryCode: 'US',
          confidence: 0.8
        },
        target: {
          latitude: 51.5074,
          longitude: -0.1278,
          countryCode: 'GB',
          organization: 'Target Corp',
          sector: 'Financial',
          criticality: 0.9
        },
        intermediateHops: [
          { latitude: 48.8566, longitude: 2.3522 }, // Paris
          { latitude: 52.5200, longitude: 13.4050 }  // Berlin
        ],
        protocol: 'HTTPS',
        port: 443,
        duration: 5000,
        packet_count: 1500
      };

      expect(trajectory.source.countryCode).toBe('US');
      expect(trajectory.target.sector).toBe('Financial');
      expect(trajectory.intermediateHops).toHaveLength(2);
      expect(trajectory.duration).toBe(5000);
    });
  });

  // =============================================================================
  // CYBERATTACK DATA VALIDATION TESTS
  // =============================================================================

  describe('validateCyberAttackData', () => {
    const validAttackData = {
      id: 'attack-123',
      type: 'CyberAttacks',
      location: { latitude: 40.7128, longitude: -74.0060 },
      timestamp: new Date('2025-07-19T10:00:00Z'),
      metadata: { source: 'SIEM', confidence: 0.9 },
      priority: 'high',
      status: 'active',
      attack_type: 'DDoS',
      attack_vector: 'Network',
      attack_phase: 'Impact',
      severity: 4,
      attack_status: 'in_progress',
      trajectory: {
        source: {
          latitude: 40.7128,
          longitude: -74.0060,
          countryCode: 'US',
          confidence: 0.8
        },
        target: {
          latitude: 51.5074,
          longitude: -0.1278,
          countryCode: 'GB',
          organization: 'Target Corp',
          sector: 'Financial',
          criticality: 0.9
        },
        duration: 3000
      },
      timeline: {
        firstDetected: new Date('2025-07-19T10:00:00Z'),
        lastSeen: new Date('2025-07-19T10:05:00Z')
      },
      technical_data: {
        mitre_tactic: ['Initial Access'],
        protocols: ['TCP'],
        ports: [80, 443]
      }
    };

    test('should validate correct CyberAttack data', () => {
      const result = validateCyberAttackData(validAttackData);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('attack-123');
      expect(result?.attack_type).toBe('DDoS');
      expect(result?.severity).toBe(4);
    });

    test('should reject data without required fields', () => {
      const invalidData = { ...validAttackData };
      delete (invalidData as { id?: string }).id;
      
      expect(validateCyberAttackData(invalidData)).toBeNull();
    });

    test('should reject data with invalid attack_type', () => {
      const invalidData = { 
        ...validAttackData, 
        attack_type: 'InvalidType' 
      };
      
      expect(validateCyberAttackData(invalidData)).toBeNull();
    });

    test('should reject data with invalid severity', () => {
      const invalidData = { 
        ...validAttackData, 
        severity: 10 
      };
      
      expect(validateCyberAttackData(invalidData)).toBeNull();
    });

    test('should reject data without trajectory', () => {
      const invalidData = { ...validAttackData };
      delete (invalidData as { trajectory?: unknown }).trajectory;
      
      expect(validateCyberAttackData(invalidData)).toBeNull();
    });

    test('should reject data with incomplete trajectory', () => {
      const invalidData = { 
        ...validAttackData, 
        trajectory: { source: validAttackData.trajectory.source } 
      };
      
      expect(validateCyberAttackData(invalidData)).toBeNull();
    });

    test('should handle null and undefined gracefully', () => {
      expect(validateCyberAttackData(null)).toBeNull();
      expect(validateCyberAttackData(undefined)).toBeNull();
      expect(validateCyberAttackData('string')).toBeNull();
      expect(validateCyberAttackData(123)).toBeNull();
    });
  });

  // =============================================================================
  // CONSTANTS AND COLOR SCHEMES TESTS
  // =============================================================================

  describe('Constants and Color Schemes', () => {
    test('should have colors for all attack types', () => {
      const attackTypes: AttackType[] = [
        'DDoS', 'Malware', 'Phishing', 'DataBreach', 'Ransomware',
        'APT', 'Botnet', 'WebAttack', 'NetworkIntrusion', 'Unknown'
      ];

      attackTypes.forEach(type => {
        expect(ATTACK_TYPE_COLORS[type]).toBeDefined();
        expect(typeof ATTACK_TYPE_COLORS[type]).toBe('string');
        expect(ATTACK_TYPE_COLORS[type]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('should have colors for all severity levels', () => {
      const severityLevels: SeverityLevel[] = [1, 2, 3, 4, 5];

      severityLevels.forEach(level => {
        expect(SEVERITY_COLORS[level]).toBeDefined();
        expect(typeof SEVERITY_COLORS[level]).toBe('string');
        expect(SEVERITY_COLORS[level]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('should have colors for all industry sectors', () => {
      const expectedSectors = [
        'Government', 'Financial', 'Healthcare', 'Energy', 'Transportation',
        'Communications', 'Manufacturing', 'Defense', 'Education', 'Retail',
        'Technology', 'Other'
      ];

      expectedSectors.forEach(sector => {
        expect(SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS]).toBeDefined();
      });
    });

    test('should have reasonable constant values', () => {
      expect(CYBER_ATTACK_CONSTANTS.MAX_TRAJECTORY_HOPS).toBeGreaterThan(0);
      expect(CYBER_ATTACK_CONSTANTS.MAX_CONCURRENT_ATTACKS).toBeGreaterThan(0);
      expect(CYBER_ATTACK_CONSTANTS.DEFAULT_ANIMATION_DURATION).toBeGreaterThan(0);
      expect(CYBER_ATTACK_CONSTANTS.DEFAULT_UPDATE_INTERVAL).toBeGreaterThan(0);
      expect(CYBER_ATTACK_CONSTANTS.TARGET_FPS).toBeGreaterThan(0);
      expect(CYBER_ATTACK_CONSTANTS.MEMORY_LIMIT_MB).toBeGreaterThan(0);
    });

    test('should have logical relationships between constants', () => {
      expect(CYBER_ATTACK_CONSTANTS.MAX_TRAJECTORY_HOPS).toBeLessThanOrEqual(20);
      expect(CYBER_ATTACK_CONSTANTS.TARGET_FPS).toBeLessThanOrEqual(60);
      expect(CYBER_ATTACK_CONSTANTS.CONFIDENCE_THRESHOLD).toBeGreaterThanOrEqual(0);
      expect(CYBER_ATTACK_CONSTANTS.CONFIDENCE_THRESHOLD).toBeLessThanOrEqual(1);
    });
  });

  // =============================================================================
  // COMPLEX DATA STRUCTURE TESTS
  // =============================================================================

  describe('Complex Data Structures', () => {
    test('should create a complete CyberAttackData object', () => {
      const completeAttack: CyberAttackData = {
        id: 'attack-456',
        type: 'CyberAttacks',
        location: { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
        timestamp: new Date(),
        metadata: { source: 'EDR', confidence: 0.95, analyst: 'John Doe' },
        priority: 'critical',
        status: 'active',
        
        attack_type: 'APT',
        attack_vector: 'Email',
        attack_phase: 'Initial_Access',
        severity: 5,
        attack_status: 'in_progress',
        
        trajectory: {
          source: {
            latitude: 39.9042,
            longitude: 116.4074, // Beijing
            countryCode: 'CN',
            organization: 'APT Group',
            confidence: 0.7
          },
          target: {
            latitude: 35.6762,
            longitude: 139.6503, // Tokyo
            countryCode: 'JP',
            organization: 'Tech Corp',
            sector: 'Technology',
            criticality: 0.95
          },
          duration: 7200000 // 2 hours
        },
        
        timeline: {
          firstDetected: new Date('2025-07-19T08:00:00Z'),
          lastSeen: new Date('2025-07-19T10:00:00Z'),
          estimatedStart: new Date('2025-07-19T07:30:00Z')
        },
        
        technical_data: {
          mitre_tactic: ['Initial Access', 'Persistence'],
          mitre_technique: ['T1566.001', 'T1053.005'],
          file_hashes: ['abc123...', 'def456...'],
          ip_addresses: ['192.168.1.100', '10.0.0.50'],
          malware_family: 'APT29',
          c2_servers: ['evil.example.com']
        },
        
        attribution: {
          threat_actor: 'APT29',
          campaign: 'Operation Example',
          confidence: 0.8,
          last_updated: new Date()
        }
      };

      expect(completeAttack.id).toBe('attack-456');
      expect(completeAttack.attack_type).toBe('APT');
      expect(completeAttack.severity).toBe(5);
      expect(completeAttack.trajectory.source.countryCode).toBe('CN');
      expect(completeAttack.trajectory.target.sector).toBe('Technology');
      expect(completeAttack.technical_data.mitre_tactic).toContain('Initial Access');
      expect(completeAttack.attribution?.threat_actor).toBe('APT29');
    });

    test('should handle optional fields correctly', () => {
      const minimalAttack: CyberAttackData = {
        id: 'attack-minimal',
        type: 'CyberAttacks',
        location: { latitude: 0, longitude: 0 },
        timestamp: new Date(),
        metadata: { source: 'test', confidence: 1.0 },
        priority: 'low',
        status: 'resolved',
        
        attack_type: 'Unknown',
        attack_vector: 'Unknown',
        attack_phase: 'Impact',
        severity: 1,
        attack_status: 'resolved',
        
        trajectory: {
          source: {
            latitude: 0,
            longitude: 0,
            countryCode: 'XX',
            confidence: 0.5
          },
          target: {
            latitude: 0,
            longitude: 0,
            countryCode: 'XX',
            organization: 'Unknown',
            sector: 'Other',
            criticality: 0.1
          },
          duration: 1000
        },
        
        timeline: {
          firstDetected: new Date(),
          lastSeen: new Date()
        },
        
        technical_data: {}
      };

      expect(minimalAttack.attack_type).toBe('Unknown');
      expect(minimalAttack.severity).toBe(1);
      expect(minimalAttack.technical_data).toEqual({});
      expect(minimalAttack.response).toBeUndefined();
      expect(minimalAttack.attribution).toBeUndefined();
    });
  });

  // =============================================================================
  // SERIALIZATION TESTS
  // =============================================================================

  describe('Serialization', () => {
    test('should serialize and deserialize CyberAttackData', () => {
      const attack: CyberAttackData = {
        id: 'attack-serialize',
        type: 'CyberAttacks',
        location: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date('2025-07-19T10:00:00Z'),
        metadata: { source: 'test', confidence: 0.9 },
        priority: 'high',
        status: 'active',
        attack_type: 'DDoS',
        attack_vector: 'Network',
        attack_phase: 'Impact',
        severity: 4,
        attack_status: 'in_progress',
        trajectory: {
          source: {
            latitude: 40.7128,
            longitude: -74.0060,
            countryCode: 'US',
            confidence: 0.8
          },
          target: {
            latitude: 51.5074,
            longitude: -0.1278,
            countryCode: 'GB',
            organization: 'Target',
            sector: 'Financial',
            criticality: 0.9
          },
          duration: 3000
        },
        timeline: {
          firstDetected: new Date('2025-07-19T10:00:00Z'),
          lastSeen: new Date('2025-07-19T10:05:00Z')
        },
        technical_data: {}
      };

      const serialized = JSON.stringify(attack);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.id).toBe(attack.id);
      expect(parsed.attack_type).toBe(attack.attack_type);
      expect(parsed.severity).toBe(attack.severity);
      expect(parsed.trajectory.source.countryCode).toBe(attack.trajectory.source.countryCode);
    });
  });
});
