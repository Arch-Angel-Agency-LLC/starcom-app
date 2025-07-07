/**
 * IntelDataCore - Sample Data Generator
 * 
 * This utility generates sample intelligence data for testing and development.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  NodeEntity,
  EdgeRelationship,
  NodeType,
  ClassificationLevel
} from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';

/**
 * Generate a set of sample intelligence data for testing
 */
export async function generateSampleData(nodeCount: number = 30, edgeCount: number = 50): Promise<void> {
  console.log(`Generating sample data: ${nodeCount} nodes and ${edgeCount} edges`);
  
  // Clear existing data first
  await clearAllData();
  
  // Generate nodes
  const nodeIds: string[] = [];
  const nodeTypes = Object.values(NodeType);
  
  for (let i = 0; i < nodeCount; i++) {
    const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    
    const node: Partial<NodeEntity> = {
      type: 'node',
      nodeType,
      title: `${nodeType} ${i + 1}`,
      description: `Sample ${nodeType.toLowerCase()} for testing purposes`,
      classification: ClassificationLevel.UNCLASSIFIED,
      source: 'Sample Generator',
      verified: Math.random() > 0.3, // 70% chance of being verified
      confidence: Math.floor(Math.random() * 100),
      createdBy: 'system',
      properties: generateRandomProperties(nodeType),
      tags: generateRandomTags(),
      displayOptions: {
        size: 25 + Math.floor(Math.random() * 25),
        color: getRandomColor(),
        icon: getRandomIcon(nodeType),
        shape: getRandomShape()
      }
    };
    
    const result = await intelDataStore.createEntity<NodeEntity>(node);
    if (result.success && result.data) {
      nodeIds.push(result.data.id);
    }
  }
  
  // Generate edges between nodes
  const relationshipTypes = [
    'ASSOCIATES_WITH', 
    'COMMUNICATES_WITH', 
    'OWNS', 
    'LOCATED_AT', 
    'PART_OF', 
    'ACCESSED', 
    'CONTROLS',
    'AFFILIATED_WITH'
  ];
  
  for (let i = 0; i < edgeCount; i++) {
    // Get two random nodes
    const sourceIndex = Math.floor(Math.random() * nodeIds.length);
    let targetIndex;
    do {
      targetIndex = Math.floor(Math.random() * nodeIds.length);
    } while (targetIndex === sourceIndex);
    
    const sourceId = nodeIds[sourceIndex];
    const targetId = nodeIds[targetIndex];
    
    // Create relationship
    const relType = relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)];
    const relationship: Partial<EdgeRelationship> = {
      type: relType,
      sourceId,
      targetId,
      strength: 10 + Math.floor(Math.random() * 90),
      direction: Math.random() > 0.7 ? 'bidirectional' : 'unidirectional',
      createdBy: 'system',
      confidence: Math.floor(Math.random() * 100),
      tags: generateRandomTags(),
      timeframe: {
        startDate: new Date(Date.now() - Math.random() * 86400000 * 365).toISOString(),
        isEstimated: Math.random() > 0.5
      },
      displayOptions: {
        width: 1 + Math.floor(Math.random() * 5),
        color: getRandomColor(),
        style: Math.random() > 0.7 ? 'dashed' : 'solid',
      }
    };
    
    await intelDataStore.createRelationship(relationship);
  }
  
  console.log('Sample data generation complete!');
}

/**
 * Clear all data from the store
 */
async function clearAllData(): Promise<void> {
  // This is a simplified approach for the in-memory store
  // A production implementation would need a proper method to clear the store
  
  const allEntities = await intelDataStore.queryEntities({});
  if (allEntities.success && allEntities.data) {
    for (const entity of allEntities.data) {
      await intelDataStore.deleteEntity(entity.id);
    }
  }
}

/**
 * Generate random properties based on node type
 */
function generateRandomProperties(nodeType: string): Record<string, any> {
  const properties: Record<string, any> = {};
  
  switch (nodeType) {
    case NodeType.PERSON:
      properties.firstName = getRandomFirstName();
      properties.lastName = getRandomLastName();
      properties.age = 18 + Math.floor(Math.random() * 70);
      properties.nationality = getRandomCountry();
      properties.occupation = getRandomOccupation();
      break;
      
    case NodeType.ORGANIZATION:
      properties.name = getRandomCompanyName();
      properties.industry = getRandomIndustry();
      properties.employeeCount = 10 + Math.floor(Math.random() * 990);
      properties.founded = 1900 + Math.floor(Math.random() * 123);
      properties.country = getRandomCountry();
      break;
      
    case NodeType.LOCATION:
      properties.name = getRandomLocationName();
      properties.country = getRandomCountry();
      properties.latitude = (Math.random() * 180) - 90;
      properties.longitude = (Math.random() * 360) - 180;
      properties.population = Math.floor(Math.random() * 1000000);
      break;
      
    case NodeType.IP_ADDRESS:
      properties.address = getRandomIpAddress();
      properties.provider = getRandomISP();
      properties.country = getRandomCountry();
      properties.active = Math.random() > 0.2;
      break;
      
    case NodeType.DOMAIN:
      properties.name = getRandomDomainName();
      properties.registrar = getRandomRegistrar();
      properties.registered = new Date(Date.now() - Math.random() * 86400000 * 1000).toISOString();
      properties.expiresAt = new Date(Date.now() + Math.random() * 86400000 * 1000).toISOString();
      break;
      
    default:
      properties.name = `Sample ${nodeType}`;
      properties.value = Math.floor(Math.random() * 100);
  }
  
  return properties;
}

/**
 * Generate random tags
 */
function generateRandomTags(): string[] {
  const allTags = [
    'high-value', 'suspicious', 'confirmed', 'watch-list', 'archived',
    'priority', 'intelligence', 'open-source', 'confidential', 'foreign',
    'domestic', 'technical', 'financial', 'political', 'military',
    'cyber', 'physical', 'analytical', 'tactical', 'strategic'
  ];
  
  const tagCount = 1 + Math.floor(Math.random() * 4); // 1-4 tags
  const tags: string[] = [];
  
  for (let i = 0; i < tagCount; i++) {
    const index = Math.floor(Math.random() * allTags.length);
    if (!tags.includes(allTags[index])) {
      tags.push(allTags[index]);
    }
  }
  
  return tags;
}

/**
 * Get a random color
 */
function getRandomColor(): string {
  const colors = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
    '#1877F2', '#E4405F', '#1DA1F2', '#0077B5', // Social media colors
    '#FF9900', '#146EB4', '#232F3E', '#FF6B6B', // Corporate colors
    '#7952B3', '#FD7E14', '#20C997', '#6F42C1'  // Bootstrap colors
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get a random icon based on node type
 */
function getRandomIcon(nodeType: string): string {
  const icons: Record<string, string[]> = {
    [NodeType.PERSON]: ['user', 'user-tie', 'user-secret', 'user-graduate', 'user-ninja'],
    [NodeType.ORGANIZATION]: ['building', 'industry', 'landmark', 'university', 'hospital'],
    [NodeType.LOCATION]: ['map-marker', 'map-pin', 'globe', 'city', 'mountain'],
    [NodeType.IP_ADDRESS]: ['network-wired', 'server', 'desktop', 'laptop', 'mobile'],
    [NodeType.DOMAIN]: ['globe', 'window-maximize', 'browser', 'cloud', 'sitemap'],
    [NodeType.FILE]: ['file', 'file-pdf', 'file-code', 'file-image', 'file-archive'],
    [NodeType.MALWARE]: ['bug', 'virus', 'radiation', 'biohazard', 'skull'],
    [NodeType.THREAT_ACTOR]: ['user-secret', 'mask', 'user-ninja', 'user-shield', 'user-injured'],
    [NodeType.SYSTEM]: ['server', 'database', 'microchip', 'hdd', 'memory'],
  };
  
  const typeIcons = icons[nodeType] || ['question', 'info', 'exclamation', 'star', 'circle'];
  return typeIcons[Math.floor(Math.random() * typeIcons.length)];
}

/**
 * Get a random shape
 */
function getRandomShape(): string {
  const shapes = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star', 'dot'];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

// Random data generator helper functions
function getRandomFirstName(): string {
  const names = ['John', 'Jane', 'Alex', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'James', 'Emily'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomLastName(): string {
  const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomCompanyName(): string {
  const prefixes = ['Global', 'Advanced', 'Unified', 'Strategic', 'Premier', 'Elite', 'Digital', 'Dynamic', 'Innovative'];
  const roots = ['Tech', 'Systems', 'Networks', 'Solutions', 'Industries', 'Partners', 'Ventures', 'Enterprises'];
  const suffixes = ['Inc', 'LLC', 'Corp', 'Group', 'International', 'Associates', 'Limited'];
  
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${roots[Math.floor(Math.random() * roots.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

function getRandomLocationName(): string {
  const prefixes = ['North', 'South', 'East', 'West', 'New', 'Old', 'Upper', 'Lower', 'Central'];
  const roots = ['York', 'London', 'Paris', 'Berlin', 'Tokyo', 'Sydney', 'Moscow', 'Delhi', 'Cairo'];
  
  if (Math.random() > 0.5) {
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${roots[Math.floor(Math.random() * roots.length)]}`;
  } else {
    return roots[Math.floor(Math.random() * roots.length)];
  }
}

function getRandomCountry(): string {
  const countries = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Japan', 'Australia', 'China', 'Brazil', 'India'];
  return countries[Math.floor(Math.random() * countries.length)];
}

function getRandomOccupation(): string {
  const occupations = ['Engineer', 'Doctor', 'Teacher', 'Lawyer', 'Scientist', 'Artist', 'Writer', 'Entrepreneur', 'Manager', 'Technician'];
  return occupations[Math.floor(Math.random() * occupations.length)];
}

function getRandomIndustry(): string {
  const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Media', 'Education', 'Transportation', 'Agriculture'];
  return industries[Math.floor(Math.random() * industries.length)];
}

function getRandomIpAddress(): string {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function getRandomISP(): string {
  const isps = ['Comcast', 'AT&T', 'Verizon', 'T-Mobile', 'Spectrum', 'CenturyLink', 'Cox', 'Charter', 'Frontier', 'Windstream'];
  return isps[Math.floor(Math.random() * isps.length)];
}

function getRandomDomainName(): string {
  const prefixes = ['secure', 'my', 'cloud', 'web', 'data', 'app', 'smart', 'cyber', 'tech', 'net'];
  const roots = ['system', 'connect', 'link', 'portal', 'hub', 'center', 'platform', 'space', 'zone', 'spot'];
  const tlds = ['.com', '.net', '.org', '.io', '.tech', '.ai', '.co', '.biz', '.info', '.app'];
  
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${roots[Math.floor(Math.random() * roots.length)]}${tlds[Math.floor(Math.random() * tlds.length)]}`;
}

function getRandomRegistrar(): string {
  const registrars = ['GoDaddy', 'Namecheap', 'Network Solutions', 'Google Domains', 'Cloudflare', 'NameSilo', 'Bluehost', 'HostGator', 'DreamHost', 'Domain.com'];
  return registrars[Math.floor(Math.random() * registrars.length)];
}

// Export a function to initialize sample data
export async function initializeSampleData(): Promise<void> {
  // Generate a moderate amount of sample data by default
  await generateSampleData(40, 80);
}
