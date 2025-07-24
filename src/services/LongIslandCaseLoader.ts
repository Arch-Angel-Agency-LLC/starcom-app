/**
 * Long Island Case Vault Loader
 * 
 * Loads the real Long Island Case Obsidian vault data into the IntelWeb system
 */

import { VirtualFile, VirtualFileSystem, DataPackRelationship, VirtualDirectory } from '../types/DataPack';

/**
 * Long Island Case Markdown Content Library
 * This contains the actual content from the real .md files in src/data/The Long Island Case/
 */
const LONG_ISLAND_MARKDOWN_CONTENT: Record<string, string> = {
  // People - Real content from actual .md files
  'People/Ian Killeen.md': `Ian's Mom: [[Linda Gulli Killeen]]
Ian's Uncle: [[Roy Gulli Killeen]]

#nurse 

Ians patients "WRITE HIM LETTERS"
[[Nicholas Tedesco]] read that letter that was apparently from Steph... given to Nick by Ian???

![[SM_Ian_Killeen_Good_Samaritan_Hospital.png]]`,

  'People/Stephanie Mininni.md': `34 Years Old

Stephanie.Killeen.39
@truarkga39x

Stephanie Mininni claims she was "Molested, Groomed and Trafficked" _and is now trauma responding to awakening repressed memories._

Stephanie posted 6 videos talking about what's been going on
1. When Steph did her post on Facebook on June 20th, [[James Puchett]] put the "Laughing" reaction to it!!!

Claims she was "Manipulated to make suicide videos"
she was on **Suboxone** (claims of relapse... but relapse isn't possible with **Suboxone**)

Went to the #5thPrecinct [[Suffolk County Police Department]] to report after making her videos.
After she went back home and was *(captured?)* taken to the Hospital [[CPEP]]?

#Mininni #whistleblower

[[Patchogue]] [[Long Island, NY]] 

- [[Anthony Killeen]] is a nurse at [[Stony Brook]]- that is where Stephanie was brought for emergency psych. *"He has the ability to not only access her medical records but I am sure has some influence on those who provided her treatment."* 
- Stephanie was ***not*** brought to Stony Brook from the police. 
- #5thPrecinct[[Suffolk County Police Department]] took her statement and stated they'll investigate. Her mother called called the cops later that day with false accusations. 
- Stephanie agreed to go to the hospital because she wanted to prove she was not on drugs. Her toxicology report was clean at [[Stony Brook Hospital]]

*Still no posts online from Stephanie...*

[[Nicholas Tedesco]] claims friendship and that they met together in [[CPEP]] and that Stephanie gave him a letter... [[Ian Killeen]] talks about "receiving" such letters... did [[Nicholas Tedesco]] get that letter from [[Ian Killeen]]?`,

  'People/Nicholas Tedesco.md': `(Nick) (@walmartwatch, @walmartwatch2)

connected to [[James Puchett]] and likely related to [[Aaron Tedesco]]

_**"Nick"** -_@walmartwatch2* - (20 yrs old) - nugg3t.z (insta and snap)
- *"Nick (walmartwatch2) had another tiktok account (walmartwatch) which was apparently banned!"*

**Relationship**:
- "Devyn Ivers" @jablinski420`,

  'People/James Puchett.md': `Son of [[Nora Susan Milligan]]

a.k.a. James Puckett

Located in [[Mesa, AZ]]

Friends with [[Aaron Tedesco]]`,

  'People/Aaron Tedesco.md': `#Tedesco

Friends with [[James Puchett]]`,

  'People/Anthony Killeen.md': `#Killeen #nurse #medical

Nurse at [[Stony Brook Hospital]] where [[Stephanie Mininni]] was brought for emergency psych. Has ability to access her medical records and influence treatment.`,

  'People/Linda Gulli Killeen.md': `A.K.A.: Gloria, Sonshine, Sonshine2133, @born2be_free

[[Roy Gulli Killeen]] is brother, [[Ian Killeen]] is son.

Master Hairstylist, Born Again Christian, K-8 teacher at [[North Shore Christian School]] for 15 years.

Connected to [[Wading River, NY]] and [[Shoreham]].

#Killeen`,

  'People/Nora Susan Milligan.md': `[[Stephanie Mininni]] said Nora is behind the whole thing

[[CPEP]]

#Milligan

- *"And she [[Stephanie Mininni]] had Nora Milligan as a follower but interestingly Nora's account was banned..."*

**Youtube Videos:**`,

  'People/Desiree D\'Iorio.md': `Works for [[American Homefront Project]]

#reporter`,

  // Organizations
  'Organizations/CPEP.md': `[[Stony Brook Hospital]] CPEP. [[Nicholas Tedesco]] claims to be a regular for CPEP`,

  'Organizations/Suffolk County Police Department.md': `#5thPrecinct where [[Stephanie Mininni]] went to report. Law enforcement agency.`,

  'Organizations/American Homefront Project.md': `[[Desiree D'Iorio]] works for American Homefront`,

  // Establishments
  'Establishments/Stony Brook Hospital.md': `#medical. [[Nora Susan Milligan]] is a CCP for [[CPEP]] at this Hospital. Where [[Stephanie Mininni]] was brought and [[Anthony Killeen]] works as a nurse.`,

  'Establishments/Good Samaritan Hospital.md': `Hospital where [[Ian Killeen]] works as a nurse. Patients write him letters.`,

  'Establishments/North Shore Christian School.md': `Christian school where [[Linda Gulli Killeen]] worked as K-8 teacher for 15 years.`,

  // Regions  
  'Regions/Patchogue.md': `Location on [[Long Island, NY]] where [[Stephanie Mininni]] is from.`,

  'Regions/Long Island, NY.md': `Main location of the investigation. Connected to [[Patchogue]] and other regional areas.`,

  'Regions/Mesa, AZ.md': `Location where [[James Puchett]] is located.`,

  'Regions/Wading River, NY.md': `Location connected to [[Linda Gulli Killeen]] and [[Shoreham]]. Has reallifechurch.`,

  'Regions/Shoreham.md': `Small town connected to [[Wading River, NY]] where Killeens live. School is called "Shoreham/Wading River".`
};

/**
 * Function to load real markdown file content
 */
async function loadRealMarkdownContent(relativePath: string): Promise<string> {
  // Check if we have the content in our library
  if (LONG_ISLAND_MARKDOWN_CONTENT[relativePath]) {
    return LONG_ISLAND_MARKDOWN_CONTENT[relativePath];
  }
  
  // For files not in our library, return a basic template
  const fileName = relativePath.split('/').pop()?.replace('.md', '') || 'Unknown';
  return `# ${fileName}\n\nInvestigation file from Long Island Case.\n\n*Real content would be loaded from: ${relativePath}*`;
}

// Simplified return type for IntelWeb compatibility
interface LongIslandCaseVault {
  id: string;
  name: string;
  description: string;
  version: string;
  classification: string;
  confidence: number;
  sources: string[];
  tags: string[];
  coordinates: [number, number];
  fileSystem: VirtualFileSystem;
  createdAt: string;
  lastModified: string;
}

// Cache configuration (for future use)
const _CACHE_KEY = 'intelweb-longisland-vault-v1';
const _CACHE_EXPIRY_HOURS = 24;

interface EntityMetadata {
  category: 'person' | 'organization' | 'establishment' | 'region';
  tags: string[];
  linkedEntities: string[];
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET';
  confidence: number;
}

/**
 * Extracts metadata from markdown content
 */
function extractMetadata(content: string, fileName: string, category: EntityMetadata['category']): EntityMetadata {
  const tags: string[] = [];
  const linkedEntities: string[] = [];
  
  // Extract hashtags
  const hashtagMatches = content.match(/#\w+/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.slice(1)));
  }
  
  // Extract wikilinks [[Entity Name]]
  const wikilinkMatches = content.match(/\[\[([^\]]+)\]\]/g);
  if (wikilinkMatches) {
    linkedEntities.push(...wikilinkMatches.map(link => link.slice(2, -2)));
  }
  
  // Determine classification based on content keywords
  let classification: EntityMetadata['classification'] = 'UNCLASSIFIED';
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('trafficking') || lowerContent.includes('criminal')) {
    classification = 'CONFIDENTIAL';
  }
  if (lowerContent.includes('investigation') || lowerContent.includes('suspect')) {
    classification = 'SECRET';
  }
  
  // Calculate confidence based on content richness and connections
  let confidence = 0.5;
  if (linkedEntities.length > 0) confidence += 0.2;
  if (content.length > 100) confidence += 0.1;
  if (tags.length > 0) confidence += 0.1;
  if (linkedEntities.length > 2) confidence += 0.1;
  
  return {
    category,
    tags,
    linkedEntities,
    classification,
    confidence: Math.min(confidence, 1.0)
  };
}

/**
 * Gets approximate coordinates for regions (for demonstration)
 */
function getRegionCoordinates(regionName: string): [number, number] | undefined {
  const coordinates: Record<string, [number, number]> = {
    'Long Island, NY': [40.7891, -73.1350],
    'Riverhead': [40.9176, -72.6617],
    'Suffolk County': [40.8518, -72.8797],
    'Stony Brook': [40.9140, -73.1409],
    'Brookhaven': [40.7834, -72.9151],
    'Mesa, AZ': [33.4152, -111.8315]
  };
  
  return coordinates[regionName];
}

/**
 * Creates VirtualFile from markdown content
 */
function createVirtualFile(fileName: string, content: string, category: EntityMetadata['category']): VirtualFile {
  const metadata = extractMetadata(content, fileName, category);
  
  // Add intelligence frontmatter to the content
  const frontmatter = `---
classification: ${metadata.classification}
confidence: ${metadata.confidence}
category: ${metadata.category}
tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]
linkedEntities: [${metadata.linkedEntities.map(entity => `"${entity}"`).join(', ')}]
source: "Long Island Case Investigation"
created: "2025-07-24"
lastModified: "2025-07-24"
---

`;

  const fullContent = frontmatter + content;
  const filePath = `/${category}/${fileName}.md`; // Revert to singular

  return {
    path: filePath,
    name: `${fileName}.md`,
    extension: '.md',
    size: fullContent.length,
    mimeType: 'text/markdown',
    encoding: 'utf-8',
    hash: `sha256-${btoa(fullContent).slice(0, 32)}`, // Simple hash for demo
    createdAt: '2025-07-24T00:00:00Z',
    modifiedAt: '2025-07-24T00:00:00Z',
    content: fullContent,
    frontmatter: {
      classification: metadata.classification,
      confidence: metadata.confidence,
      category: metadata.category,
      tags: metadata.tags,
      linkedEntities: metadata.linkedEntities,
      source: "Long Island Case Investigation",
      coordinates: category === 'region' ? getRegionCoordinates(fileName) : undefined
    },
    wikilinks: metadata.linkedEntities,
    hashtags: metadata.tags,
    backlinks: [],
    relationships: []
  };
}

/**
 * Creates relationships between files based on wikilinks with enhanced bidirectional detection
 */
function createRelationships(files: VirtualFile[]): DataPackRelationship[] {
  const relationships: DataPackRelationship[] = [];
  const filesByName = new Map<string, VirtualFile>();
  
  // Create lookup map
  files.forEach(file => {
    const entityName = file.name.replace('.md', '');
    filesByName.set(entityName, file);
  });
  
  console.log('🔍 Enhanced Relationship Analysis Starting...');
  console.log(`📊 Processing ${files.length} files for wikilink relationships`);
  
  // Debug: Show file structure
  console.log('🗂️ File Structure Debug:');
  files.slice(0, 3).forEach(file => {
    console.log(`- File: ${file.name} (path: ${file.path})`);
    console.log(`  Wikilinks: ${JSON.stringify(file.wikilinks)}`);
  });
  
  // Debug: Show lookup map
  console.log('🔍 File Lookup Map Debug:');
  const lookupEntries = Array.from(filesByName.entries()).slice(0, 5);
  lookupEntries.forEach(([key, file]) => {
    console.log(`- "${key}" -> ${file.path}`);
  });
  
  // Phase 1: Build connection matrix to detect bidirectional relationships
  const connectionMatrix = new Map<string, Set<string>>();
  
  files.forEach(sourceFile => {
    if (sourceFile.wikilinks && sourceFile.wikilinks.length > 0) {
      const sourcePath = sourceFile.path;
      
      sourceFile.wikilinks.forEach(linkedEntity => {
        const targetFile = filesByName.get(linkedEntity);
        if (targetFile) {
          const targetPath = targetFile.path;
          
          // Initialize connection sets if they don't exist
          if (!connectionMatrix.has(sourcePath)) {
            connectionMatrix.set(sourcePath, new Set());
          }
          
          // Add the connection
          connectionMatrix.get(sourcePath)!.add(targetPath);
        }
      });
    }
  });
  
  // Phase 2: Create relationships with proper bidirectional handling
  const processedPairs = new Set<string>();
  
  connectionMatrix.forEach((targets, sourcePath) => {
    targets.forEach(targetPath => {
      // Create a unique pair identifier (sorted to avoid duplicates)
      const pairKey = [sourcePath, targetPath].sort().join('|');
      
      // Skip if we've already processed this pair
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);
      
      const sourceFile = Array.from(files).find(f => f.path === sourcePath);
      const targetFile = Array.from(files).find(f => f.path === targetPath);
      
      if (!sourceFile || !targetFile) return;
      
      // Check if connection is bidirectional
      const sourceToTarget = connectionMatrix.get(sourcePath)?.has(targetPath) || false;
      const targetToSource = connectionMatrix.get(targetPath)?.has(sourcePath) || false;
      const isBidirectional = sourceToTarget && targetToSource;
      
      // Calculate base relationship strength based on context
      let baseStrength = 0.6;
      const sourceContent = (typeof sourceFile.content === 'string' ? sourceFile.content : '').toLowerCase();
      const targetContent = (typeof targetFile.content === 'string' ? targetFile.content : '').toLowerCase();
      
      // Increase strength for family connections
      if (sourceContent.includes('family') || sourceContent.includes('son of') || 
          sourceContent.includes('mother of') || sourceContent.includes('father of') ||
          sourceContent.includes('married to') || sourceContent.includes('brother of') ||
          sourceContent.includes('daughter of') || sourceContent.includes('wife of') ||
          targetContent.includes('family') || targetContent.includes('son of') ||
          targetContent.includes('mother of') || targetContent.includes('father of') ||
          targetContent.includes('married to') || targetContent.includes('brother of') ||
          targetContent.includes('daughter of') || targetContent.includes('wife of')) {
        baseStrength = 0.9;
      }
      // Business/organizational connections
      else if (sourceContent.includes('works for') || sourceContent.includes('member of') ||
               targetContent.includes('works for') || targetContent.includes('member of')) {
        baseStrength = 0.8;
      }
      // Location connections
      else if (sourceContent.includes('located in') || sourceContent.includes('location of') ||
               targetContent.includes('located in') || targetContent.includes('location of')) {
        baseStrength = 0.7;
      }
      
      // Apply bidirectional multiplier (2x thickness for mutual connections)
      const finalStrength = isBidirectional ? Math.min(baseStrength * 1.5, 1.0) : baseStrength;
      
      // Create the relationship
      relationships.push({
        source: sourcePath,
        target: targetPath,
        type: 'wikilink',
        strength: finalStrength,
        metadata: {
          sourceCategory: sourceFile.frontmatter?.category,
          targetCategory: targetFile.frontmatter?.category,
          bidirectional: isBidirectional,
          connectionType: isBidirectional ? 'mutual' : 'unidirectional',
          sourceToTarget: sourceToTarget,
          targetToSource: targetToSource
        }
      });
      
      // Add backlinks
      if (!targetFile.backlinks) targetFile.backlinks = [];
      if (!targetFile.backlinks.includes(sourceFile.path)) {
        targetFile.backlinks.push(sourceFile.path);
      }
      
      if (isBidirectional && !sourceFile.backlinks) sourceFile.backlinks = [];
      if (isBidirectional && !sourceFile.backlinks!.includes(targetFile.path)) {
        sourceFile.backlinks!.push(targetFile.path);
      }
    });
  });
  
  // Analysis and logging
  const bidirectionalCount = relationships.filter(r => r.metadata?.bidirectional).length;
  const unidirectionalCount = relationships.length - bidirectionalCount;
  const bidirectionalPercentage = Math.round((bidirectionalCount / relationships.length) * 100);
  
  console.log('📈 Relationship Analysis Complete:');
  console.log(`- Total relationships: ${relationships.length}`);
  console.log(`- Bidirectional (2-way): ${bidirectionalCount} (${bidirectionalPercentage}%)`);
  console.log(`- Unidirectional (1-way): ${unidirectionalCount} (${100 - bidirectionalPercentage}%)`);
  
  // Show some examples of bidirectional relationships
  const bidirectionalExamples = relationships
    .filter(rel => rel.metadata?.bidirectional)
    .slice(0, 3)
    .map(rel => {
      const sourceName = rel.source.split('/').pop()?.replace('.md', '');
      const targetName = rel.target.split('/').pop()?.replace('.md', '');
      return `${sourceName} ↔ ${targetName} (strength: ${rel.strength.toFixed(2)})`;
    });
  
  if (bidirectionalExamples.length > 0) {
    console.log('🔄 Bidirectional Examples:');
    bidirectionalExamples.forEach(example => console.log(`- ${example}`));
  }
  
  return relationships;
}

/**
 * Loads the complete Long Island Case vault with real markdown content
 * Returns a simplified structure for IntelWeb compatibility
 */
export async function loadLongIslandCaseVault(): Promise<LongIslandCaseVault> {
  console.log('🏗️ Building Long Island Case vault with real markdown content...');
  
  // Create all file entries with real content loading
  const fileEntries = Object.keys(LONG_ISLAND_MARKDOWN_CONTENT).map(async (path) => {
    const realContent = await loadRealMarkdownContent(path);
    const fileName = path.split('/').pop()?.replace('.md', '') || 'Unknown';
    const category = path.startsWith('People/') ? 'person' :
                    path.startsWith('Organizations/') ? 'organization' :
                    path.startsWith('Establishments/') ? 'establishment' :
                    path.startsWith('Regions/') ? 'region' : 'other';
    
    return {
      path,
      name: fileName,
      content: realContent,
      category
    };
  });
  
  // Wait for all content to load
  const ALL_LONG_ISLAND_FILES = await Promise.all(fileEntries);
  
  console.log(`📄 Loaded ${ALL_LONG_ISLAND_FILES.length} files with real content`);
  const files: VirtualFile[] = [];
  
  // Load all files from comprehensive dataset
  ALL_LONG_ISLAND_FILES.forEach(fileData => {
    files.push(createVirtualFile(fileData.name, fileData.content, fileData.category as EntityMetadata['category']));
  });
  
  console.log(`📚 Loaded ${files.length} files from comprehensive Long Island Case vault`);
  console.log(`- People: ${files.filter(f => f.frontmatter?.category === 'person').length}`);
  console.log(`- Organizations: ${files.filter(f => f.frontmatter?.category === 'organization').length}`);
  console.log(`- Establishments: ${files.filter(f => f.frontmatter?.category === 'establishment').length}`);
  console.log(`- Regions: ${files.filter(f => f.frontmatter?.category === 'region').length}`);
  
  // Create relationships with enhanced bidirectional detection
  const relationships = createRelationships(files);
  
  // Update file relationships
  files.forEach(file => {
    file.relationships = relationships.filter(rel => 
      rel.source === file.path || rel.target === file.path
    );
  });
  
  // Create directories
  const directories = new Map<string, VirtualDirectory>([
    ['/person', { 
      name: 'People', 
      path: '/person',
      parent: '/',
      children: files.filter(f => f.frontmatter?.category === 'person').map(f => f.path),
      files: files.filter(f => f.frontmatter?.category === 'person').map(f => f.path),
      createdAt: '2025-07-24T00:00:00Z',
      modifiedAt: '2025-07-24T00:00:00Z'
    }],
    ['/organization', { 
      name: 'Organizations', 
      path: '/organization',
      parent: '/',
      children: files.filter(f => f.frontmatter?.category === 'organization').map(f => f.path),
      files: files.filter(f => f.frontmatter?.category === 'organization').map(f => f.path),
      createdAt: '2025-07-24T00:00:00Z',
      modifiedAt: '2025-07-24T00:00:00Z'
    }],
    ['/establishment', { 
      name: 'Establishments', 
      path: '/establishment',
      parent: '/',
      children: files.filter(f => f.frontmatter?.category === 'establishment').map(f => f.path),
      files: files.filter(f => f.frontmatter?.category === 'establishment').map(f => f.path),
      createdAt: '2025-07-24T00:00:00Z',
      modifiedAt: '2025-07-24T00:00:00Z'
    }],
    ['/region', { 
      name: 'Regions', 
      path: '/region',
      parent: '/',
      children: files.filter(f => f.frontmatter?.category === 'region').map(f => f.path),
      files: files.filter(f => f.frontmatter?.category === 'region').map(f => f.path),
      createdAt: '2025-07-24T00:00:00Z',
      modifiedAt: '2025-07-24T00:00:00Z'
    }]
  ]);
  
  // Create virtual file system
  const virtualFileSystem: VirtualFileSystem = {
    root: {
      name: 'Long Island Case',
      path: '/',
      children: ['/person', '/organization', '/establishment', '/region'],
      files: [],
      createdAt: '2025-07-24T00:00:00Z',
      modifiedAt: '2025-07-24T00:00:00Z'
    },
    fileIndex: new Map(files.map(file => [file.path, file])),
    directoryIndex: directories,
    relationshipGraph: relationships
  };
  
  // Return simplified package for IntelWeb compatibility
  return {
    id: 'long-island-case-2025',
    name: 'Long Island Case Investigation',
    description: 'Comprehensive intelligence vault for the Long Island human trafficking investigation',
    version: '2.0.0',
    classification: 'SECRET',
    confidence: 0.85,
    sources: ['HUMINT', 'OSINT', 'Law Enforcement Records'],
    tags: ['investigation', 'human-trafficking', 'long-island', 'criminal-network'],
    coordinates: [40.7891, -73.1350], // Long Island center
    fileSystem: virtualFileSystem,
    createdAt: '2025-07-24T00:00:00Z',
    lastModified: '2025-07-24T00:00:00Z'
  };
}

/**
 * Gets demo vault statistics for display
 */
export async function getLongIslandCaseStats() {
  // Use the content keys to get stats since we know the structure
  const contentKeys = Object.keys(LONG_ISLAND_MARKDOWN_CONTENT);
  const totalPeople = contentKeys.filter(path => path.startsWith('People/')).length;
  const totalOrganizations = contentKeys.filter(path => path.startsWith('Organizations/')).length;
  const totalEstablishments = contentKeys.filter(path => path.startsWith('Establishments/')).length;
  const totalRegions = contentKeys.filter(path => path.startsWith('Regions/')).length;
  const totalEntities = totalPeople + totalOrganizations + totalEstablishments + totalRegions;
  
  return {
    totalEntities,
    breakdown: {
      people: totalPeople,
      organizations: totalOrganizations,
      establishments: totalEstablishments,
      regions: totalRegions
    },
    description: 'Comprehensive intelligence case data from Long Island human trafficking investigation with real markdown content'
  };
}

/**
 * Analyzes Long Island Case relationships for statistics
 */
export async function analyzeLongIslandCaseRelationships() {
  const vault = await loadLongIslandCaseVault();
  const relationships = vault.fileSystem.relationshipGraph;
  
  const bidirectionalRelationships = relationships.filter(r => r.metadata?.bidirectional).length;
  const unidirectionalRelationships = relationships.length - bidirectionalRelationships;
  const bidirectionalPercentage = Math.round((bidirectionalRelationships / relationships.length) * 100);
  
  // Find most connected entities
  const connectionCounts = new Map<string, number>();
  relationships.forEach(rel => {
    const sourceName = rel.source.split('/').pop()?.replace('.md', '') || '';
    const targetName = rel.target.split('/').pop()?.replace('.md', '') || '';
    
    connectionCounts.set(sourceName, (connectionCounts.get(sourceName) || 0) + 1);
    connectionCounts.set(targetName, (connectionCounts.get(targetName) || 0) + 1);
  });
  
  const topConnectedEntities = Array.from(connectionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([entity, connections]) => ({ entity, connections }));
  
  return {
    totalRelationships: relationships.length,
    bidirectionalRelationships,
    unidirectionalRelationships,
    bidirectionalPercentage,
    topConnectedEntities
  };
}
