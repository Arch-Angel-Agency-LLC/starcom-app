/**
 * WorkflowTemplates.ts
 * 
 * Pre-built workflow templates for common OSINT investigations.
 * Provides ready-to-use workflows for various intelligence collection scenarios.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { WorkflowTemplate } from './WorkflowEngine';

/**
 * Template for domain intelligence gathering
 */
export const DOMAIN_INTELLIGENCE_TEMPLATE: WorkflowTemplate = {
  id: 'domain-intel-v1',
  name: 'Domain Intelligence Collection',
  description: 'Comprehensive intelligence gathering for a target domain including subdomains, emails, and infrastructure analysis.',
  category: 'Domain Analysis',
  difficulty: 'beginner',
  estimatedDuration: 15, // minutes
  requiredTools: ['shodan', 'theharvester', 'intel-analyzer'],
  definition: {
    id: 'domain-intel-workflow',
    name: 'Domain Intelligence Workflow',
    description: 'Automated domain intelligence collection and analysis',
    version: '1.0.0',
    author: 'NetRunner',
    category: 'Domain Analysis',
    tags: ['domain', 'subdomain', 'email', 'infrastructure'],
    inputs: [
      {
        name: 'domain',
        type: 'string',
        required: true,
        description: 'Target domain to analyze (e.g., example.com)',
        validation: [
          {
            type: 'regex',
            value: '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\\.[a-zA-Z]{2,})$',
            message: 'Must be a valid domain name'
          }
        ]
      },
      {
        name: 'includeSubdomains',
        type: 'boolean',
        required: false,
        description: 'Include subdomain enumeration',
        default: true
      },
      {
        name: 'maxResults',
        type: 'number',
        required: false,
        description: 'Maximum number of results per tool',
        default: 100,
        validation: [
          {
            type: 'range',
            value: { min: 1, max: 1000 },
            message: 'Must be between 1 and 1000'
          }
        ]
      }
    ],
    outputs: [
      {
        name: 'domainInfo',
        type: 'object',
        description: 'Comprehensive domain intelligence report',
        source: 'intel-analysis'
      },
      {
        name: 'subdomains',
        type: 'array',
        description: 'Discovered subdomains',
        source: 'subdomain-enum'
      },
      {
        name: 'emails',
        type: 'array',
        description: 'Discovered email addresses',
        source: 'email-harvest'
      },
      {
        name: 'infrastructure',
        type: 'object',
        description: 'Infrastructure and hosting information',
        source: 'infrastructure-scan'
      }
    ],
    tasks: [
      {
        id: 'email-harvest',
        name: 'Email Harvesting',
        description: 'Collect email addresses associated with the domain',
        toolId: 'theharvester',
        parameters: {
          domain: '${input.domain}',
          sources: ['google', 'bing', 'linkedin', 'twitter'],
          limit: '${input.maxResults}'
        },
        dependencies: [],
        timeout: 300000, // 5 minutes
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: 'exponential',
          initialDelay: 5000,
          maxDelay: 30000,
          multiplier: 2
        },
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'subdomain-enum',
        name: 'Subdomain Enumeration',
        description: 'Discover subdomains for the target domain',
        toolId: 'theharvester',
        parameters: {
          domain: '${input.domain}',
          sources: ['sublist3r', 'crt.sh', 'dns'],
          limit: '${input.maxResults}',
          includeSubdomains: '${input.includeSubdomains}'
        },
        dependencies: [],
        condition: {
          type: 'expression',
          expression: '${input.includeSubdomains} === true'
        },
        timeout: 600000, // 10 minutes
        retryPolicy: {
          maxAttempts: 2,
          backoffStrategy: 'linear',
          initialDelay: 10000,
          multiplier: 5000
        },
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'infrastructure-scan',
        name: 'Infrastructure Scanning',
        description: 'Scan for exposed services and infrastructure information',
        toolId: 'shodan',
        parameters: {
          query: 'hostname:${input.domain}',
          facets: ['port', 'country', 'org'],
          limit: '${input.maxResults}'
        },
        dependencies: [],
        timeout: 300000, // 5 minutes
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: 'exponential',
          initialDelay: 3000,
          maxDelay: 20000,
          multiplier: 2
        },
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'intel-analysis',
        name: 'Intelligence Analysis',
        description: 'Analyze and correlate collected intelligence',
        toolId: 'intel-analyzer',
        parameters: {
          emailData: '${task.email-harvest.result}',
          subdomainData: '${task.subdomain-enum.result}',
          infrastructureData: '${task.infrastructure-scan.result}',
          analysisDepth: 'comprehensive'
        },
        dependencies: ['email-harvest', 'subdomain-enum', 'infrastructure-scan'],
        timeout: 180000, // 3 minutes
        retryPolicy: {
          maxAttempts: 2,
          backoffStrategy: 'fixed',
          initialDelay: 5000
        },
        status: 'pending',
        retryCount: 0
      }
    ],
    maxExecutionTime: 1800000, // 30 minutes
    retryPolicy: {
      maxAttempts: 1,
      backoffStrategy: 'fixed',
      initialDelay: 0
    }
  },
  exampleInputs: {
    domain: 'example.com',
    includeSubdomains: true,
    maxResults: 50
  },
  documentation: `
# Domain Intelligence Collection Workflow

This workflow performs comprehensive intelligence gathering for a target domain.

## What it does:
1. **Email Harvesting**: Collects email addresses from various sources
2. **Subdomain Enumeration**: Discovers subdomains (optional)
3. **Infrastructure Scanning**: Uses Shodan to find exposed services
4. **Intelligence Analysis**: Correlates findings and generates report

## Use cases:
- Reconnaissance for security assessments
- Threat intelligence gathering
- Brand monitoring and protection
- Compliance and asset discovery

## Required inputs:
- **domain**: Target domain (required)
- **includeSubdomains**: Whether to enumerate subdomains (optional, default: true)
- **maxResults**: Maximum results per tool (optional, default: 100)

## Outputs:
- Comprehensive domain intelligence report
- List of discovered subdomains
- Email addresses associated with the domain
- Infrastructure and hosting information

## Estimated time: 15-30 minutes
## Difficulty: Beginner
  `
};

/**
 * Template for IP address investigation
 */
export const IP_INVESTIGATION_TEMPLATE: WorkflowTemplate = {
  id: 'ip-investigation-v1',
  name: 'IP Address Investigation',
  description: 'Deep dive investigation of an IP address including geolocation, services, and threat intelligence.',
  category: 'Network Analysis',
  difficulty: 'intermediate',
  estimatedDuration: 10,
  requiredTools: ['shodan', 'intel-analyzer'],
  definition: {
    id: 'ip-investigation-workflow',
    name: 'IP Investigation Workflow',
    description: 'Comprehensive IP address analysis and threat assessment',
    version: '1.0.0',
    author: 'NetRunner',
    category: 'Network Analysis',
    tags: ['ip', 'network', 'services', 'threats'],
    inputs: [
      {
        name: 'ipAddress',
        type: 'string',
        required: true,
        description: 'Target IP address to investigate',
        validation: [
          {
            type: 'regex',
            value: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
            message: 'Must be a valid IPv4 address'
          }
        ]
      },
      {
        name: 'includeHistory',
        type: 'boolean',
        required: false,
        description: 'Include historical data analysis',
        default: false
      }
    ],
    outputs: [
      {
        name: 'ipReport',
        type: 'object',
        description: 'Comprehensive IP investigation report',
        source: 'ip-analysis'
      },
      {
        name: 'services',
        type: 'array',
        description: 'Discovered services and ports',
        source: 'service-scan'
      },
      {
        name: 'threatIntel',
        type: 'object',
        description: 'Threat intelligence assessment',
        source: 'threat-analysis'
      }
    ],
    tasks: [
      {
        id: 'service-scan',
        name: 'Service Discovery',
        description: 'Scan for open ports and running services',
        toolId: 'shodan',
        parameters: {
          ip: '${input.ipAddress}',
          history: '${input.includeHistory}'
        },
        dependencies: [],
        timeout: 120000, // 2 minutes
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'threat-analysis',
        name: 'Threat Intelligence Analysis',
        description: 'Analyze IP for threat indicators and reputation',
        toolId: 'intel-analyzer',
        parameters: {
          target: '${input.ipAddress}',
          type: 'ip_address',
          analysisType: 'threat_intelligence'
        },
        dependencies: [],
        timeout: 60000, // 1 minute
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'ip-analysis',
        name: 'Comprehensive IP Analysis',
        description: 'Correlate service and threat data for final assessment',
        toolId: 'intel-analyzer',
        parameters: {
          serviceData: '${task.service-scan.result}',
          threatData: '${task.threat-analysis.result}',
          target: '${input.ipAddress}',
          analysisType: 'comprehensive'
        },
        dependencies: ['service-scan', 'threat-analysis'],
        timeout: 90000, // 1.5 minutes
        status: 'pending',
        retryCount: 0
      }
    ]
  },
  exampleInputs: {
    ipAddress: '8.8.8.8',
    includeHistory: false
  },
  documentation: `
# IP Address Investigation Workflow

Performs deep analysis of an IP address for security and intelligence purposes.

## Features:
- Service discovery and port scanning
- Threat intelligence correlation
- Geolocation and ASN information
- Historical analysis (optional)

## Use cases:
- Incident response investigation
- Threat hunting and analysis
- Network security assessment
- Due diligence for IP reputation

## Estimated time: 5-10 minutes
## Difficulty: Intermediate
  `
};

/**
 * Template for email investigation
 */
export const EMAIL_INVESTIGATION_TEMPLATE: WorkflowTemplate = {
  id: 'email-investigation-v1',
  name: 'Email Address Investigation',
  description: 'Investigate an email address for OSINT including breaches, social media, and domain analysis.',
  category: 'People Intelligence',
  difficulty: 'beginner',
  estimatedDuration: 8,
  requiredTools: ['theharvester', 'intel-analyzer'],
  definition: {
    id: 'email-investigation-workflow',
    name: 'Email Investigation Workflow',
    description: 'Comprehensive email address intelligence gathering',
    version: '1.0.0',
    author: 'NetRunner',
    category: 'People Intelligence',
    tags: ['email', 'people', 'breaches', 'social'],
    inputs: [
      {
        name: 'emailAddress',
        type: 'string',
        required: true,
        description: 'Target email address to investigate',
        validation: [
          {
            type: 'regex',
            value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            message: 'Must be a valid email address'
          }
        ]
      },
      {
        name: 'includeSocial',
        type: 'boolean',
        required: false,
        description: 'Include social media investigation',
        default: true
      }
    ],
    outputs: [
      {
        name: 'emailReport',
        type: 'object',
        description: 'Comprehensive email investigation report',
        source: 'email-analysis'
      },
      {
        name: 'breachData',
        type: 'array',
        description: 'Known data breaches containing this email',
        source: 'breach-check'
      },
      {
        name: 'socialProfiles',
        type: 'array',
        description: 'Associated social media profiles',
        source: 'social-search'
      }
    ],
    tasks: [
      {
        id: 'breach-check',
        name: 'Data Breach Investigation',
        description: 'Check if email appears in known data breaches',
        toolId: 'intel-analyzer',
        parameters: {
          email: '${input.emailAddress}',
          analysisType: 'breach_check'
        },
        dependencies: [],
        timeout: 60000,
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'social-search',
        name: 'Social Media Search',
        description: 'Search for social media profiles associated with email',
        toolId: 'theharvester',
        parameters: {
          email: '${input.emailAddress}',
          sources: ['linkedin', 'twitter', 'facebook'],
          includeSocial: '${input.includeSocial}'
        },
        dependencies: [],
        condition: {
          type: 'expression',
          expression: '${input.includeSocial} === true'
        },
        timeout: 180000,
        status: 'pending',
        retryCount: 0
      },
      {
        id: 'email-analysis',
        name: 'Email Intelligence Analysis',
        description: 'Correlate findings and generate comprehensive report',
        toolId: 'intel-analyzer',
        parameters: {
          email: '${input.emailAddress}',
          breachData: '${task.breach-check.result}',
          socialData: '${task.social-search.result}',
          analysisType: 'comprehensive'
        },
        dependencies: ['breach-check', 'social-search'],
        timeout: 90000,
        status: 'pending',
        retryCount: 0
      }
    ]
  },
  exampleInputs: {
    emailAddress: 'example@domain.com',
    includeSocial: true
  },
  documentation: `
# Email Address Investigation Workflow

Comprehensive investigation of an email address for intelligence gathering.

## Features:
- Data breach checking
- Social media profile discovery
- Email validation and analysis
- Domain relationship mapping

## Use cases:
- People intelligence gathering
- Identity verification
- Security incident investigation
- Due diligence research

## Estimated time: 5-8 minutes
## Difficulty: Beginner
  `
};

/**
 * Registry of all available workflow templates
 */
export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  [DOMAIN_INTELLIGENCE_TEMPLATE.id]: DOMAIN_INTELLIGENCE_TEMPLATE,
  [IP_INVESTIGATION_TEMPLATE.id]: IP_INVESTIGATION_TEMPLATE,
  [EMAIL_INVESTIGATION_TEMPLATE.id]: EMAIL_INVESTIGATION_TEMPLATE
};

/**
 * Get all workflow templates
 */
export function getAllWorkflowTemplates(): WorkflowTemplate[] {
  return Object.values(WORKFLOW_TEMPLATES);
}

/**
 * Get workflow template by ID
 */
export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES[id];
}

/**
 * Get workflow templates by category
 */
export function getWorkflowTemplatesByCategory(category: string): WorkflowTemplate[] {
  return Object.values(WORKFLOW_TEMPLATES).filter(template => 
    template.category === category
  );
}

/**
 * Get workflow templates by difficulty level
 */
export function getWorkflowTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return Object.values(WORKFLOW_TEMPLATES).filter(template => 
    template.difficulty === difficulty
  );
}

/**
 * Search workflow templates by keywords
 */
export function searchWorkflowTemplates(query: string): WorkflowTemplate[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  return Object.values(WORKFLOW_TEMPLATES).filter(template => {
    const searchableText = [
      template.name,
      template.description,
      template.category,
      ...template.definition.tags,
      template.documentation
    ].join(' ').toLowerCase();
    
    return searchTerms.every(term => searchableText.includes(term));
  });
}
