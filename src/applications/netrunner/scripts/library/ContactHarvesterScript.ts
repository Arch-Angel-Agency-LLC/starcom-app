/**
 * Contact Harvester Script
 * 
 * Extracts and organizes contact information from various data sources
 * including phone numbers, addresses, social media profiles, and 
 * professional information.
 * 
 * Features:
 * - Phone number extraction and validation
 * - Physical address parsing
 * - Social media profile detection
 * - Professional title and role identification
 * - Contact validation and verification
 * - Duplicate detection and merging
 */

import { 
  ScriptDefinition, 
  ScriptInput, 
  ScriptResult, 
  ScriptErrorType, 
  ScriptExecutionContext,
  ProcessedIntelligenceData,
  ConfigurationValue,
  ProcessedDataValue,
  ErrorContext
} from '../types/ScriptTypes';

export interface ContactInfo {
  id: string;
  type: 'person' | 'organization' | 'role' | 'unknown';
  name?: string;
  emails: string[];
  phones: PhoneInfo[];
  addresses: AddressInfo[];
  socialProfiles: SocialProfile[];
  professionalInfo: ProfessionalInfo;
  confidence: number;
  lastSeen: Date;
  sources: string[];
  metadata: {
    isVerified: boolean;
    isPrimary: boolean;
    isActive: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    dataQuality: number; // 0-1 scale
  };
}

export interface PhoneInfo {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'fax' | 'unknown';
  country?: string;
  isValid: boolean;
  confidence: number;
}

export interface AddressInfo {
  full: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  type: 'home' | 'business' | 'mailing' | 'unknown';
  isValid: boolean;
  confidence: number;
}

export interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'github' | 'other';
  username?: string;
  url: string;
  isVerified: boolean;
  followerCount?: number;
  confidence: number;
}

export interface ProfessionalInfo {
  title?: string;
  company?: string;
  department?: string;
  industry?: string;
  experience?: string;
  skills: string[];
  certifications: string[];
}

export interface ContactHarvesterOptions {
  includePhones: boolean;
  includeAddresses: boolean;
  includeSocialProfiles: boolean;
  validateContacts: boolean;
  mergeDuplicates: boolean;
  minConfidence: number;
}

export interface ContactHarvesterResult extends Record<string, unknown> {
  contacts: ContactInfo[];
  totalContacts: number;
  uniqueEmails: number;
  uniquePhones: number;
  socialProfileCount: number;
  contactTypes: Record<string, number>;
  qualityScore: number; // Overall data quality 0-1
  summary: {
    primaryContacts: ContactInfo[];
    organizationContacts: ContactInfo[];
    socialMediaPresence: SocialProfile[];
    geographicDistribution: Record<string, number>;
  };
}

/**
 * Contact Harvester Script Implementation
 */
export const ContactHarvesterScript: ScriptDefinition = {
  metadata: {
    id: 'contact-harvester',
    name: 'Contact Harvester',
    version: '1.0.0',
    description: 'Extract and organize contact information from various data sources',
    author: 'NetRunner Scripts',
    category: 'contact-harvesting',
    tags: ['contacts', 'emails', 'phones', 'addresses', 'social', 'harvesting'],
    dependencies: [],
    created: new Date(),
    updated: new Date()
  },
  
  configuration: {
    inputTypes: ['raw-osint-data', 'website-scan-results', 'social-media-data'],
    outputTypes: ['contact-information', 'structured-intel', 'analysis-report'],
    parameters: [
      {
        name: 'includePhones',
        type: 'boolean',
        description: 'Extract and validate phone numbers',
        required: false
      },
      {
        name: 'includeAddresses', 
        type: 'boolean',
        description: 'Extract and parse physical addresses',
        required: false
      },
      {
        name: 'includeSocialProfiles',
        type: 'boolean', 
        description: 'Detect and analyze social media profiles',
        required: false
      },
      {
        name: 'validateContacts',
        type: 'boolean',
        description: 'Perform validation on extracted contact information',
        required: false
      },
      {
        name: 'mergeDuplicates',
        type: 'boolean',
        description: 'Merge duplicate contact entries',
        required: false
      },
      {
        name: 'minConfidence',
        type: 'number',
        description: 'Minimum confidence threshold for contact inclusion',
        required: false
      }
    ],
    defaults: {
      includePhones: true,
      includeAddresses: true,
      includeSocialProfiles: true,
      validateContacts: true,
      mergeDuplicates: true,
      minConfidence: 0.6
    },
    required: []
  },
  
  execute: async (
    input: ScriptInput,
    config: Record<string, ConfigurationValue>,
    _context: ScriptExecutionContext
  ): Promise<ScriptResult> => {
    const startTime = new Date();
    const executionId = `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validate input data
      if (!input.data) {
        const errorContext: ErrorContext = {
          scriptId: 'contact-harvester',
          executionId,
          step: 'input-validation',
          environment: 'browser',
          userAgent: navigator.userAgent || 'unknown'
        };
        
        return {
          success: false,
          error: {
            type: ScriptErrorType.DATA_VALIDATION_ERROR,
            code: 'DVE026',
            message: 'Contact Harvester requires valid input data',
            details: `Input data type: ${typeof input.data}`,
            context: errorContext,
            timestamp: new Date(),
            recoverable: true,
            suggestions: ['Provide OSINT data, website content, or social media data']
          },
          metrics: {
            startTime,
            endTime: new Date(),
            duration: Date.now() - startTime.getTime(),
            memoryUsage: 0,
            cpuUsage: 0,
            networkRequests: 0,
            cacheHits: 0,
            cacheMisses: 0
          },
          metadata: {
            scriptId: 'contact-harvester',
            scriptVersion: '1.0.0',
            executionId,
            sourceData: 'invalid-input',
            processingSteps: [],
            qualityScore: 0,
            flags: ['validation-failed']
          }
        };
      }
      
      const options: ContactHarvesterOptions = {
        includePhones: (config.includePhones as boolean) ?? true,
        includeAddresses: (config.includeAddresses as boolean) ?? true,
        includeSocialProfiles: (config.includeSocialProfiles as boolean) ?? true,
        validateContacts: (config.validateContacts as boolean) ?? true,
        mergeDuplicates: (config.mergeDuplicates as boolean) ?? true,
        minConfidence: (config.minConfidence as number) ?? 0.6
      };
      
      // Extract content for contact harvesting
      const harvestData = extractHarvestData(input.data);
      
      // Harvest contacts from different sources
      const rawContacts = await harvestContacts(harvestData, options);
      
      // Filter by confidence and merge duplicates
      let filteredContacts = rawContacts.filter(contact => contact.confidence >= options.minConfidence);
      
      if (options.mergeDuplicates) {
        filteredContacts = mergeDuplicateContacts(filteredContacts);
      }
      
      // Generate comprehensive contact analysis
      const result = generateContactAnalysis(filteredContacts, options);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Prepare processed intelligence data
      const processedData: ProcessedIntelligenceData = {
        type: 'contact-information',
        category: 'contact-harvesting',
        confidence: filteredContacts.length > 0 ? 
          filteredContacts.reduce((sum, c) => sum + c.confidence, 0) / filteredContacts.length : 0,
        data: result as ProcessedDataValue,
        relationships: generateContactRelationships(filteredContacts),
        enrichments: [],
        validations: [{
          valid: filteredContacts.length > 0,
          confidence: filteredContacts.length > 0 ? 0.8 : 0.2,
          issues: [],
          suggestions: filteredContacts.length === 0 ? ['Verify input contains contact information'] : []
        }]
      };
      
      return {
        success: true,
        data: processedData,
        metrics: {
          startTime,
          endTime,
          duration,
          memoryUsage: Math.floor(JSON.stringify(harvestData).length / 1024),
          cpuUsage: filteredContacts.length * 20, // Rough estimate
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'contact-harvester',
          scriptVersion: '1.0.0',
          executionId,
          sourceData: input.source || 'unknown',
          processingSteps: [
            { step: 'data-extraction', duration: duration * 0.15, success: true, details: 'Extracted text and structured data' },
            { step: 'contact-harvesting', duration: duration * 0.5, success: true, details: `Harvested ${rawContacts.length} potential contacts` },
            { step: 'validation-filtering', duration: duration * 0.2, success: true, details: `Validated and filtered to ${filteredContacts.length} contacts` },
            { step: 'duplicate-merging', duration: duration * 0.1, success: options.mergeDuplicates, details: 'Merged duplicate contact entries' },
            { step: 'analysis-generation', duration: duration * 0.05, success: true, details: 'Generated contact analysis report' }
          ],
          qualityScore: result.qualityScore,
          flags: filteredContacts.length === 0 ? ['no-contacts-found'] : []
        }
      };
      
    } catch (error) {
      const endTime = new Date();
      const errorContext: ErrorContext = {
        scriptId: 'contact-harvester',
        executionId,
        step: 'execution',
        environment: 'browser',
        userAgent: navigator.userAgent || 'unknown'
      };
      
      return {
        success: false,
        error: {
          type: ScriptErrorType.SCRIPT_RUNTIME_ERROR,
          code: 'SRE002',
          message: error instanceof Error ? error.message : 'Unknown error during contact harvesting',
          details: `Error: ${String(error)}`,
          context: errorContext,
          timestamp: new Date(),
          recoverable: true,
          suggestions: ['Check input data format', 'Verify contact extraction patterns']
        },
        metrics: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          memoryUsage: 0,
          cpuUsage: 0,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId: 'contact-harvester',
          scriptVersion: '1.0.0',
          executionId,
          sourceData: 'error-occurred',
          processingSteps: [],
          qualityScore: 0,
          flags: ['execution-error']
        }
      };
    }
  }
};

/**
 * Extract harvest data from various input types
 */
function extractHarvestData(data: ProcessedDataValue | object): HarvestData {
  const result: HarvestData = {
    text: '',
    html: '',
    structured: {},
    metadata: {}
  };
  
  if (typeof data === 'string') {
    result.text = data;
  } else if (typeof data === 'object' && data !== null) {
    if ('text' in data) result.text = String(data.text);
    if ('html' in data) result.html = String(data.html);
    if ('content' in data) result.text += ' ' + String(data.content);
    
    result.structured = data as Record<string, unknown>;
  }
  
  return result;
}

interface HarvestData {
  text: string;
  html: string;
  structured: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

/**
 * Harvest contacts from extracted data
 */
async function harvestContacts(data: HarvestData, options: ContactHarvesterOptions): Promise<ContactInfo[]> {
  const contacts: ContactInfo[] = [];
  
  // Extract emails and build contact profiles
  const emails = extractEmails(data.text + ' ' + data.html);
  for (const email of emails) {
    const contact = await buildContactFromEmail(email, data, options);
    if (contact) contacts.push(contact);
  }
  
  // Extract phones if enabled
  if (options.includePhones) {
    const phones = extractPhones(data.text + ' ' + data.html);
    for (const phone of phones) {
      const contact = buildContactFromPhone(phone, data);
      if (contact) contacts.push(contact);
    }
  }
  
  // Extract social profiles if enabled
  if (options.includeSocialProfiles) {
    const profiles = extractSocialProfiles(data.text + ' ' + data.html);
    for (const profile of profiles) {
      const contact = buildContactFromSocialProfile(profile, data);
      if (contact) contacts.push(contact);
    }
  }
  
  return contacts;
}

/**
 * Extract email addresses using comprehensive patterns
 */
function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern) || [];
  return [...new Set(matches.map(email => email.toLowerCase()))];
}

/**
 * Extract phone numbers using various patterns
 */
function extractPhones(text: string): string[] {
  const phonePatterns = [
    /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g, // US format
    /\+?[0-9]{1,4}[-.\s]?[0-9]{1,14}/g // International format
  ];
  
  const phones = new Set<string>();
  
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      const cleaned = match.replace(/[^\d+]/g, '');
      if (cleaned.length >= 10) {
        phones.add(cleaned);
      }
    }
  }
  
  return Array.from(phones);
}

/**
 * Extract social media profiles
 */
function extractSocialProfiles(text: string): Array<{ platform: string; url: string; username?: string }> {
  const socialPatterns = [
    { platform: 'linkedin', pattern: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/g },
    { platform: 'twitter', pattern: /(?:https?:\/\/)?(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/g },
    { platform: 'facebook', pattern: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)/g },
    { platform: 'instagram', pattern: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/g },
    { platform: 'github', pattern: /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)/g }
  ];
  
  const profiles: Array<{ platform: string; url: string; username?: string }> = [];
  
  for (const social of socialPatterns) {
    let match;
    while ((match = social.pattern.exec(text)) !== null) {
      profiles.push({
        platform: social.platform,
        url: match[0],
        username: match[1]
      });
    }
  }
  
  return profiles;
}

/**
 * Build contact profile from email
 */
async function buildContactFromEmail(
  email: string, 
  data: HarvestData, 
  options: ContactHarvesterOptions
): Promise<ContactInfo | null> {
  const contactId = generateContactId(email);
  
  // Extract name from email or surrounding context
  const name = extractNameFromContext(email, data.text);
  
  // Extract professional info
  const professionalInfo = extractProfessionalInfo(email, data.text);
  
  const contact: ContactInfo = {
    id: contactId,
    type: email.includes('@') && isBusinessEmail(email) ? 'person' : 'unknown',
    name,
    emails: [email],
    phones: [],
    addresses: options.includeAddresses ? extractAddressesFromContext(email, data.text) : [],
    socialProfiles: [],
    professionalInfo,
    confidence: calculateEmailConfidence(email, name, professionalInfo),
    lastSeen: new Date(),
    sources: ['email-extraction'],
    metadata: {
      isVerified: false,
      isPrimary: true,
      isActive: true,
      riskLevel: assessContactRisk(email),
      dataQuality: calculateDataQuality({ email, name, professionalInfo })
    }
  };
  
  return contact;
}

/**
 * Build contact profile from phone number
 */
function buildContactFromPhone(phone: string, _data: HarvestData): ContactInfo | null {
  const contactId = generateContactId(phone);
  
  const phoneInfo: PhoneInfo = {
    number: phone,
    type: classifyPhoneType(phone),
    country: extractCountryFromPhone(phone),
    isValid: validatePhoneNumber(phone),
    confidence: 0.7
  };
  
  const contact: ContactInfo = {
    id: contactId,
    type: 'unknown',
    emails: [],
    phones: [phoneInfo],
    addresses: [],
    socialProfiles: [],
    professionalInfo: {
      skills: [],
      certifications: []
    },
    confidence: phoneInfo.confidence,
    lastSeen: new Date(),
    sources: ['phone-extraction'],
    metadata: {
      isVerified: phoneInfo.isValid,
      isPrimary: false,
      isActive: true,
      riskLevel: 'low',
      dataQuality: phoneInfo.isValid ? 0.7 : 0.3
    }
  };
  
  return contact;
}

/**
 * Build contact profile from social media profile
 */
function buildContactFromSocialProfile(
  profile: { platform: string; url: string; username?: string }, 
  _data: HarvestData
): ContactInfo | null {
  const contactId = generateContactId(profile.url);
  
  const socialProfile: SocialProfile = {
    platform: profile.platform as SocialProfile['platform'],
    username: profile.username,
    url: profile.url,
    isVerified: false,
    confidence: 0.8
  };
  
  const contact: ContactInfo = {
    id: contactId,
    type: 'person',
    emails: [],
    phones: [],
    addresses: [],
    socialProfiles: [socialProfile],
    professionalInfo: {
      skills: [],
      certifications: []
    },
    confidence: socialProfile.confidence,
    lastSeen: new Date(),
    sources: ['social-media-extraction'],
    metadata: {
      isVerified: false,
      isPrimary: false,
      isActive: true,
      riskLevel: 'low',
      dataQuality: 0.6
    }
  };
  
  return contact;
}

/**
 * Helper functions for contact processing
 */
function generateContactId(identifier: string): string {
  return `contact-${btoa(identifier).replace(/[^a-zA-Z0-9]/g, '').substr(0, 8)}`;
}

function extractNameFromContext(email: string, text: string): string | undefined {
  // Simple name extraction - look for patterns near email
  const emailIndex = text.indexOf(email);
  if (emailIndex === -1) return undefined;
  
  const contextBefore = text.substring(Math.max(0, emailIndex - 100), emailIndex);
  const namePattern = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
  const match = namePattern.exec(contextBefore);
  
  return match ? match[1] : undefined;
}

function extractProfessionalInfo(email: string, _text: string): ProfessionalInfo {
  const domain = email.split('@')[1] || '';
  
  return {
    company: domain ? domain.split('.')[0] : undefined,
    skills: [],
    certifications: []
  };
}

function extractAddressesFromContext(identifier: string, text: string): AddressInfo[] {
  // Simple address extraction
  const addressPattern = /\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/g;
  const matches = text.match(addressPattern) || [];
  
  return matches.map(address => ({
    full: address,
    type: 'unknown' as const,
    isValid: true,
    confidence: 0.6
  }));
}

function isBusinessEmail(email: string): boolean {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1] || '';
  return !personalDomains.includes(domain.toLowerCase());
}

function calculateEmailConfidence(email: string, name?: string, professionalInfo?: ProfessionalInfo): number {
  let confidence = 0.5;
  
  if (email.includes('@')) confidence += 0.3;
  if (name) confidence += 0.2;
  if (professionalInfo?.company) confidence += 0.1;
  if (isBusinessEmail(email)) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function assessContactRisk(email: string): ContactInfo['metadata']['riskLevel'] {
  const suspiciousDomains = ['tempmail.org', '10minutemail.com'];
  const domain = email.split('@')[1] || '';
  
  if (suspiciousDomains.includes(domain)) return 'high';
  if (domain.includes('temp') || domain.includes('disposable')) return 'medium';
  return 'low';
}

function calculateDataQuality(data: { email?: string; name?: string; professionalInfo?: ProfessionalInfo }): number {
  let quality = 0;
  
  if (data.email) quality += 0.4;
  if (data.name) quality += 0.3;
  if (data.professionalInfo?.company) quality += 0.2;
  if (data.professionalInfo?.title) quality += 0.1;
  
  return quality;
}

function classifyPhoneType(phone: string): PhoneInfo['type'] {
  // Simple classification based on number patterns
  if (phone.startsWith('+') || phone.length > 10) return 'mobile';
  return 'unknown';
}

function extractCountryFromPhone(phone: string): string | undefined {
  if (phone.startsWith('+1')) return 'US';
  if (phone.startsWith('+44')) return 'UK';
  if (phone.startsWith('+49')) return 'DE';
  return undefined;
}

function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Merge duplicate contacts
 */
function mergeDuplicateContacts(contacts: ContactInfo[]): ContactInfo[] {
  const merged = new Map<string, ContactInfo>();
  
  for (const contact of contacts) {
    // Use email or phone as primary key for deduplication
    const key = contact.emails[0] || contact.phones[0]?.number || contact.id;
    
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      
      // Merge contact information
      existing.emails.push(...contact.emails);
      existing.phones.push(...contact.phones);
      existing.addresses.push(...contact.addresses);
      existing.socialProfiles.push(...contact.socialProfiles);
      existing.sources.push(...contact.sources);
      
      // Use highest confidence
      existing.confidence = Math.max(existing.confidence, contact.confidence);
      
      // Deduplicate arrays
      existing.emails = [...new Set(existing.emails)];
      existing.phones = deduplicatePhones(existing.phones);
      existing.addresses = deduplicateAddresses(existing.addresses);
      existing.socialProfiles = deduplicateSocialProfiles(existing.socialProfiles);
      existing.sources = [...new Set(existing.sources)];
    } else {
      merged.set(key, { ...contact });
    }
  }
  
  return Array.from(merged.values());
}

function deduplicatePhones(phones: PhoneInfo[]): PhoneInfo[] {
  const seen = new Set<string>();
  return phones.filter(phone => {
    if (seen.has(phone.number)) return false;
    seen.add(phone.number);
    return true;
  });
}

function deduplicateAddresses(addresses: AddressInfo[]): AddressInfo[] {
  const seen = new Set<string>();
  return addresses.filter(address => {
    if (seen.has(address.full)) return false;
    seen.add(address.full);
    return true;
  });
}

function deduplicateSocialProfiles(profiles: SocialProfile[]): SocialProfile[] {
  const seen = new Set<string>();
  return profiles.filter(profile => {
    if (seen.has(profile.url)) return false;
    seen.add(profile.url);
    return true;
  });
}

/**
 * Generate contact relationships
 */
function generateContactRelationships(contacts: ContactInfo[]) {
  const relationships = [];
  
  // Find contacts with same domain (likely colleagues)
  const domainGroups = new Map<string, ContactInfo[]>();
  
  for (const contact of contacts) {
    for (const email of contact.emails) {
      const domain = email.split('@')[1];
      if (domain) {
        if (!domainGroups.has(domain)) {
          domainGroups.set(domain, []);
        }
        domainGroups.get(domain)!.push(contact);
      }
    }
  }
  
  // Create colleague relationships
  for (const [domain, domainContacts] of domainGroups) {
    if (domainContacts.length > 1) {
      for (let i = 0; i < domainContacts.length; i++) {
        for (let j = i + 1; j < domainContacts.length; j++) {
          relationships.push({
            type: 'sibling' as const,
            target: domainContacts[j].id,
            confidence: 0.7,
            description: `Colleagues at ${domain}`
          });
        }
      }
    }
  }
  
  return relationships;
}

/**
 * Generate comprehensive contact analysis
 */
function generateContactAnalysis(contacts: ContactInfo[], _options: ContactHarvesterOptions): ContactHarvesterResult {
  // Calculate statistics
  const uniqueEmails = new Set(contacts.flatMap(c => c.emails)).size;
  const uniquePhones = new Set(contacts.flatMap(c => c.phones.map(p => p.number))).size;
  const socialProfileCount = contacts.reduce((sum, c) => sum + c.socialProfiles.length, 0);
  
  // Contact type distribution
  const contactTypes: Record<string, number> = {};
  contacts.forEach(contact => {
    contactTypes[contact.type] = (contactTypes[contact.type] || 0) + 1;
  });
  
  // Calculate overall quality score
  const qualityScore = contacts.length > 0 ? 
    contacts.reduce((sum, c) => sum + c.metadata.dataQuality, 0) / contacts.length : 0;
  
  // Generate summary
  const summary = generateContactSummary(contacts);
  
  return {
    contacts,
    totalContacts: contacts.length,
    uniqueEmails,
    uniquePhones,
    socialProfileCount,
    contactTypes,
    qualityScore,
    summary
  };
}

/**
 * Generate contact summary
 */
function generateContactSummary(contacts: ContactInfo[]): ContactHarvesterResult['summary'] {
  // Primary contacts (high confidence, verified)
  const primaryContacts = contacts.filter(c => 
    c.confidence > 0.8 && c.metadata.isPrimary
  ).slice(0, 5);
  
  // Organization contacts
  const organizationContacts = contacts.filter(c => c.type === 'organization');
  
  // Social media presence
  const allSocialProfiles = contacts.flatMap(c => c.socialProfiles);
  
  // Geographic distribution (from addresses)
  const geographicDistribution: Record<string, number> = {};
  contacts.forEach(contact => {
    contact.addresses.forEach(address => {
      if (address.country) {
        geographicDistribution[address.country] = (geographicDistribution[address.country] || 0) + 1;
      }
    });
  });
  
  return {
    primaryContacts,
    organizationContacts,
    socialMediaPresence: allSocialProfiles.slice(0, 10),
    geographicDistribution
  };
}
