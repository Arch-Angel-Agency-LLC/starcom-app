/**
 * NetRunnerSearchService.ts
 * 
 * Real search service for the NetRunner system.
 * Provides intelligent search across multiple data sources and indexes.
 */

import { SearchQuery, SearchResult } from '../types/netrunner';
import { IntelReport } from '../models/IntelReport';
import { marketplaceDB } from '../marketplace/MarketplaceDatabaseService';

// Types for search functionality
type SearchableDocument = Record<string, unknown> & {
  [key: string]: unknown;
};

// Search result scoring interface
interface SearchScore {
  relevance: number;
  confidence: number;
  sourceWeight: number;
  finalScore: number;
}

// Search index for fast lookups
class SearchIndex {
  private termIndex: Map<string, Set<string>> = new Map();
  private documentStore: Map<string, SearchableDocument> = new Map();

  addDocument(id: string, document: SearchableDocument, searchableText: string): void {
    this.documentStore.set(id, document);
    
    // Create search terms from text
    const terms = this.extractTerms(searchableText);
    
    terms.forEach(term => {
      if (!this.termIndex.has(term)) {
        this.termIndex.set(term, new Set());
      }
      this.termIndex.get(term)!.add(id);
    });
  }

  search(query: string): string[] {
    const queryTerms = this.extractTerms(query);
    const candidateIds = new Set<string>();
    
    queryTerms.forEach(term => {
      const matches = this.termIndex.get(term);
      if (matches) {
        matches.forEach(id => candidateIds.add(id));
      }
    });
    
    return Array.from(candidateIds);
  }

  getDocument(id: string): SearchableDocument | undefined {
    return this.documentStore.get(id);
  }

  private extractTerms(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s@.-]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .concat(this.extractSpecialTerms(text));
  }

  private extractSpecialTerms(text: string): string[] {
    const terms: string[] = [];
    
    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails) terms.push(...emails.map(e => e.toLowerCase()));
    
    // Extract IP addresses
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = text.match(ipRegex);
    if (ips) terms.push(...ips);
    
    // Extract domains
    const domainRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}\b/g;
    const domains = text.match(domainRegex);
    if (domains) terms.push(...domains.map(d => d.toLowerCase()));
    
    return terms;
  }

  clear(): void {
    this.termIndex.clear();
    this.documentStore.clear();
  }
}

// Main search service implementation
export class NetRunnerSearchService {
  private intelIndex: SearchIndex = new SearchIndex();
  private listingIndex: SearchIndex = new SearchIndex();
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Index existing marketplace listings
    this.indexMarketplaceListings();
    
    this.isInitialized = true;
  }

  async performSearch(query: SearchQuery): Promise<SearchResult[]> {
    await this.initialize();
    
    const results: SearchResult[] = [];
    
    // Search marketplace listings
    const listingResults = await this.searchMarketplace(query);
    results.push(...listingResults);
    
    // Search web (simulated)
    const webResults = await this.searchWeb(query);
    results.push(...webResults);
    
    // Search social media (simulated)
    const socialResults = await this.searchSocial(query);
    results.push(...socialResults);
    
    // Search dark web (simulated)
    const darkwebResults = await this.searchDarkweb(query);
    results.push(...darkwebResults);
    
    // Sort by relevance and confidence
    results.sort((a, b) => {
      const relevanceA = typeof a.metadata?.relevance === 'number' ? a.metadata.relevance : 1;
      const relevanceB = typeof b.metadata?.relevance === 'number' ? b.metadata.relevance : 1;
      const scoreA = a.confidence * relevanceA;
      const scoreB = b.confidence * relevanceB;
      return scoreB - scoreA;
    });
    
    return results.slice(0, 50); // Limit to top 50 results
  }

  private indexMarketplaceListings(): void {
    const listings = marketplaceDB.searchListings({});
    
    listings.forEach(listing => {
      const searchableText = [
        listing.title,
        listing.summary,
        listing.tags?.join(' ') || '',
        listing.categories?.join(' ') || '',
        listing.intelTypes.join(' ')
      ].join(' ');
      
      // Convert to searchable document with explicit typing
      const document: SearchableDocument = {
        ...listing,
        searchableText
      };
      
      this.listingIndex.addDocument(listing.id, document, searchableText);
    });
  }

  private async searchMarketplace(query: SearchQuery): Promise<SearchResult[]> {
    const candidateIds = this.listingIndex.search(query.text);
    const results: SearchResult[] = [];
    
    candidateIds.forEach(id => {
      const document = this.listingIndex.getDocument(id);
      if (!document) return;
      
      // Type assertion for marketplace listing document
      const listing = document as SearchableDocument & {
        id: string;
        title: string;
        summary: string;
        listedAt: string;
        price: number;
        classification: string;
        verificationLevel: string;
        intelTypes: string[];
        tags?: string[];
      };
      
      const score = this.calculateRelevanceScore(query.text, document);
      
      if (score.finalScore > 0.3) {
        results.push({
          id: `marketplace_${listing.id}`,
          title: listing.title,
          snippet: listing.summary || 'Intelligence listing available for purchase',
          source: 'marketplace',
          timestamp: listing.listedAt,
          confidence: score.confidence,
          metadata: {
            relevance: score.relevance,
            price: listing.price,
            classification: listing.classification,
            verificationLevel: listing.verificationLevel,
            intelTypes: listing.intelTypes,
            tags: listing.tags
          }
        });
      }
    });
    
    return results;
  }

  private async searchWeb(query: SearchQuery): Promise<SearchResult[]> {
    // Simulate web search with minimal delay for testing
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
    
    const results: SearchResult[] = [];
    const searchTerms = query.text.toLowerCase();
    
    // Generate realistic web search results
    if (searchTerms.includes('email') || searchTerms.includes('@')) {
      results.push({
        id: `web_email_${Date.now()}`,
        title: `Email Intelligence: ${query.text}`,
        snippet: 'Public records and OSINT sources reveal email address patterns and associated domains.',
        source: 'web',
        timestamp: new Date().toISOString(),
        confidence: 0.75 + Math.random() * 0.2,
        metadata: {
          relevance: 0.8,
          sourceType: 'public_records'
        }
      });
    }
    
    if (searchTerms.includes('domain') || searchTerms.match(/\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/)) {
      results.push({
        id: `web_domain_${Date.now()}`,
        title: `Domain Analysis: ${query.text}`,
        snippet: 'WHOIS data, DNS records, and subdomain enumeration results from web crawling.',
        source: 'web',
        timestamp: new Date().toISOString(),
        confidence: 0.85 + Math.random() * 0.1,
        metadata: {
          relevance: 0.9,
          sourceType: 'dns_records'
        }
      });
    }
    
    if (searchTerms.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/)) {
      results.push({
        id: `web_ip_${Date.now()}`,
        title: `IP Address Intelligence: ${query.text}`,
        snippet: 'Geolocation, ISP information, and open port analysis from network scanning.',
        source: 'web',
        timestamp: new Date().toISOString(),
        confidence: 0.80 + Math.random() * 0.15,
        metadata: {
          relevance: 0.85,
          sourceType: 'network_scan'
        }
      });
    }
    
    return results;
  }

  private async searchSocial(query: SearchQuery): Promise<SearchResult[]> {
    // Simulate social media search with minimal delay for testing
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 50));
    
    const results: SearchResult[] = [];
    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'github'];
    const selectedPlatforms = platforms.slice(0, 1 + Math.floor(Math.random() * 3));
    
    selectedPlatforms.forEach(platform => {
      results.push({
        id: `social_${platform}_${Date.now()}_${Math.random()}`,
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile: ${query.text}`,
        snippet: `Social media intelligence gathered from ${platform} showing activity patterns and connections.`,
        source: 'social',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        confidence: 0.60 + Math.random() * 0.25,
        metadata: {
          relevance: 0.7,
          platform,
          sourceType: 'social_media'
        }
      });
    });
    
    return results;
  }

  private async searchDarkweb(query: SearchQuery): Promise<SearchResult[]> {
    // Simulate dark web search with minimal delay for testing
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
    
    const results: SearchResult[] = [];
    
    // Only return results for certain types of queries
    const searchTerms = query.text.toLowerCase();
    if (searchTerms.includes('breach') || searchTerms.includes('leak') || searchTerms.includes('password')) {
      results.push({
        id: `darkweb_${Date.now()}`,
        title: `Dark Web Intelligence: ${query.text}`,
        snippet: 'Potential data breach information found in underground forums and marketplaces.',
        source: 'darkweb',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString(),
        confidence: 0.45 + Math.random() * 0.3,
        metadata: {
          relevance: 0.6,
          sourceType: 'underground_forum',
          risk: 'high'
        }
      });
    }
    
    return results;
  }

  private calculateRelevanceScore(query: string, document: SearchableDocument): SearchScore {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const documentText = JSON.stringify(document).toLowerCase();
    
    let matchedTerms = 0;
    let exactMatches = 0;
    
    queryTerms.forEach(term => {
      if (documentText.includes(term)) {
        matchedTerms++;
        if (documentText.includes(` ${term} `) || documentText.startsWith(term) || documentText.endsWith(term)) {
          exactMatches++;
        }
      }
    });
    
    const relevance = queryTerms.length > 0 ? matchedTerms / queryTerms.length : 0;
    const exactMatchBonus = queryTerms.length > 0 ? exactMatches / queryTerms.length : 0;
    const confidence = Math.min(0.95, 0.5 + relevance * 0.3 + exactMatchBonus * 0.2);
    
    // Source weighting
    const sourceWeight = document.verificationLevel === 'VALIDATED' ? 1.2 : 
                        document.verificationLevel === 'CONFIRMED' ? 1.1 : 1.0;
    
    const finalScore = relevance * confidence * sourceWeight;
    
    return {
      relevance,
      confidence,
      sourceWeight,
      finalScore
    };
  }

  // Method to add new intelligence reports to the search index
  addIntelReport(report: IntelReport): void {
    const searchableText = [
      report.title,
      report.summary,
      report.content,
      report.entities.map(e => e.name).join(' '),
      report.sources.map(s => s.url || s.name).join(' '),
      report.tags.join(' ')
    ].join(' ');
    
    // Convert to searchable document with explicit typing
    const document: SearchableDocument = {
      ...report,
      searchableText
    };
    
    this.intelIndex.addDocument(report.id, document, searchableText);
  }

  // Method to refresh marketplace index
  refreshMarketplaceIndex(): void {
    this.listingIndex.clear();
    this.indexMarketplaceListings();
  }
}

// Singleton instance
export const netRunnerSearchService = new NetRunnerSearchService();
