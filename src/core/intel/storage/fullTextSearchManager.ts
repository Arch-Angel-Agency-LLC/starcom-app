/**
 * FullTextSearchManager
 * 
 * This module provides full-text search capabilities for the IntelDataCore system.
 * It implements an inverted index for efficient text searching across all entity types
 * and provides both basic and advanced search features.
 * 
 * Features:
 * - Text tokenization and normalization
 * - Inverted index for fast lookup
 * - Relevance scoring
 * - Phrase matching
 * - Fuzzy matching (using Levenshtein distance)
 * - Field-specific searching
 * - Boolean operators (AND, OR, NOT)
 * - Stemming (reducing words to their base form)
 * - Stop word filtering
 * 
 * @module FullTextSearchManager
 */

import { BaseEntity, IntelQueryOptions } from '../types/intelDataModels';
import { storageOrchestrator } from './storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';

/**
 * Represents a term in the inverted index
 */
interface IndexedTerm {
  term: string;
  documentIds: Map<string, number>; // Map of document ID to term frequency
}

/**
 * Represents a document in the search index
 */
interface IndexedDocument {
  id: string;
  type: string;
  fields: Map<string, string>; // Field name to field content
  tokenCount: number; // Total number of tokens in the document
}

/**
 * Search query options
 */
export interface FullTextSearchOptions {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  fuzziness?: number;
  phraseMatching?: boolean;
  booleanOperators?: boolean;
  boostFields?: Record<string, number>;
  limit?: number;
  offset?: number;
  includeRelated?: boolean;
  relationshipDepth?: number;
  filter?: IntelQueryOptions;
}

/**
 * Search result with scoring
 */
export interface SearchResult<T extends BaseEntity> {
  entity: T;
  score: number;
  highlights: Record<string, string[]>;
}

// English stop words
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 
  'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 
  'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'
]);

/**
 * FullTextSearchManager class
 */
class FullTextSearchManager {
  private initialized: boolean = false;
  private invertedIndex: Map<string, IndexedTerm> = new Map();
  private documents: Map<string, IndexedDocument> = new Map();
  private defaultSearchableFields: Set<string> = new Set([
    'title', 'name', 'description', 'content', 'notes', 'tags', 'summary'
  ]);

  /**
   * Initialize the search manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Subscribe to entity changes to keep the index updated
      enhancedEventEmitter.subscribe({
        topics: ['entity:created', 'entity:updated', 'entity:deleted'],
        callback: (event: any) => {
          if (event.type === 'entity:created' && event.data) {
            this.handleEntityCreated(event.data);
          } else if (event.type === 'entity:updated' && event.data) {
            this.handleEntityUpdated(event.data);
          } else if (event.type === 'entity:deleted' && event.data) {
            this.handleEntityDeleted(event.data.id);
          }
        }
      });

      // Build initial index from existing data
      await this.buildInitialIndex();

      this.initialized = true;
      console.log('FullTextSearchManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FullTextSearchManager:', error);
      throw error;
    }
  }

  /**
   * Build the initial search index from all existing entities
   */
  private async buildInitialIndex(): Promise<void> {
    try {
      // Get all entities from storage
      const result = await storageOrchestrator.queryEntities({
        limit: 10000, // Set a high limit to get all entities
      });

      if (result.success && result.data) {
        // Add each entity to the index
        for (const entity of result.data) {
          await this.indexEntity(entity);
        }
        
        console.log(`Indexed ${this.documents.size} documents with ${this.invertedIndex.size} unique terms`);
      }
    } catch (error) {
      console.error('Error building initial search index:', error);
      throw error;
    }
  }

  /**
   * Handle entity created event
   */
  private async handleEntityCreated(entity: BaseEntity): Promise<void> {
    await this.indexEntity(entity);
  }

  /**
   * Handle entity updated event
   */
  private async handleEntityUpdated(entity: BaseEntity): Promise<void> {
    // Remove old index entries
    await this.removeEntityFromIndex(entity.id);
    // Add updated entity to index
    await this.indexEntity(entity);
  }

  /**
   * Handle entity deleted event
   */
  private async handleEntityDeleted(entityId: string): Promise<void> {
    await this.removeEntityFromIndex(entityId);
  }

  /**
   * Index an entity for full-text search
   */
  private async indexEntity(entity: BaseEntity): Promise<void> {
    try {
      // Create document object
      const document: IndexedDocument = {
        id: entity.id,
        type: entity.type,
        fields: new Map(),
        tokenCount: 0
      };

      // Extract text from searchable fields
      for (const [key, value] of Object.entries(entity)) {
        if (this.isSearchableField(key, value)) {
          const fieldContent = this.normalizeFieldContent(value);
          document.fields.set(key, fieldContent);

          // Tokenize and index field content
          const tokens = this.tokenize(fieldContent);
          document.tokenCount += tokens.length;

          for (const token of tokens) {
            if (this.isStopWord(token)) continue;
            
            const term = this.stemWord(token);
            
            // Add to inverted index
            if (!this.invertedIndex.has(term)) {
              this.invertedIndex.set(term, {
                term,
                documentIds: new Map()
              });
            }
            
            const indexedTerm = this.invertedIndex.get(term)!;
            const currentFreq = indexedTerm.documentIds.get(entity.id) || 0;
            indexedTerm.documentIds.set(entity.id, currentFreq + 1);
          }
        }
      }

      // Store document in index
      this.documents.set(entity.id, document);
    } catch (error) {
      console.error(`Error indexing entity ${entity.id}:`, error);
    }
  }

  /**
   * Remove an entity from the search index
   */
  private async removeEntityFromIndex(entityId: string): Promise<void> {
    try {
      // Get the document
      const document = this.documents.get(entityId);
      if (!document) return;

      // Remove document ID from all terms in the inverted index
      for (const [term, indexedTerm] of this.invertedIndex.entries()) {
        if (indexedTerm.documentIds.has(entityId)) {
          indexedTerm.documentIds.delete(entityId);
          
          // If no documents are left for this term, remove it from the index
          if (indexedTerm.documentIds.size === 0) {
            this.invertedIndex.delete(term);
          }
        }
      }

      // Remove document from documents map
      this.documents.delete(entityId);
    } catch (error) {
      console.error(`Error removing entity ${entityId} from index:`, error);
    }
  }

  /**
   * Search entities using full-text search
   */
  async search<T extends BaseEntity>(
    options: FullTextSearchOptions
  ): Promise<SearchResult<T>[]> {
    try {
      await this.initialize();

      const {
        query,
        fields = Array.from(this.defaultSearchableFields),
        fuzzy = true,
        fuzziness = 1,
        phraseMatching = true,
        booleanOperators = true,
        boostFields = {},
        limit = 50,
        offset = 0
      } = options;

      // Parse the query
      const { tokens, phrases, excludeTerms } = this.parseQuery(query, booleanOperators);
      
      // Score tracking
      const documentScores: Map<string, number> = new Map();
      const matchingDocIds: Set<string> = new Set();
      
      // Process tokens (single terms)
      for (const token of tokens) {
        if (this.isStopWord(token)) continue;
        
        const term = this.stemWord(token);
        const exactMatches = this.findTermMatches(term);
        
        // If fuzzy search is enabled, also look for similar terms
        let fuzzyMatches: Map<string, Map<string, number>> = new Map();
        if (fuzzy && term.length > 3) {
          fuzzyMatches = this.findFuzzyMatches(term, fuzziness);
        }
        
        // Combine exact and fuzzy matches, prioritizing exact matches
        this.processMatches(exactMatches, fuzzyMatches, documentScores, matchingDocIds, fields, boostFields, 1.0);
      }
      
      // Process phrases if phrase matching is enabled
      if (phraseMatching && phrases.length > 0) {
        for (const phrase of phrases) {
          const phraseMatches = this.findPhraseMatches(phrase, fields);
          
          // Add a higher score for phrase matches (2x the individual term match)
          for (const [docId, score] of phraseMatches) {
            const currentScore = documentScores.get(docId) || 0;
            documentScores.set(docId, currentScore + score * 2);
            matchingDocIds.add(docId);
          }
        }
      }
      
      // Remove documents with excluded terms
      if (excludeTerms.length > 0) {
        for (const term of excludeTerms) {
          const stemmedTerm = this.stemWord(term);
          const excludeMatches = this.findTermMatches(stemmedTerm);
          
          for (const docId of excludeMatches.keys()) {
            matchingDocIds.delete(docId);
            documentScores.delete(docId);
          }
        }
      }
      
      // Get all the matching documents and sort by score
      const matchingDocumentsWithScores: Array<[string, number]> = Array.from(matchingDocIds)
        .map(id => [id, documentScores.get(id) || 0] as [string, number])
        .sort((a, b) => (b[1] as number) - (a[1] as number)) // Sort by score descending
        .slice(offset, offset + limit); // Apply offset and limit
      
      // Fetch the actual entities and create search results
      const searchResults: SearchResult<T>[] = [];
      
      for (const [docId, score] of matchingDocumentsWithScores) {
        const entityResult = await storageOrchestrator.getEntity<T>(docId);
        
        if (entityResult.success && entityResult.data) {
          // Generate highlights for matching terms
          const highlights = this.generateHighlights(entityResult.data, tokens, phrases);
          
          searchResults.push({
            entity: entityResult.data,
            score,
            highlights
          });
        }
      }
      
      return searchResults;
    } catch (error) {
      console.error('Error in full-text search:', error);
      return [];
    }
  }
  
  /**
   * Process matches and update document scores
   */
  private processMatches(
    exactMatches: Map<string, Map<string, number>>,
    fuzzyMatches: Map<string, Map<string, number>>,
    documentScores: Map<string, number>,
    matchingDocIds: Set<string>,
    fields: string[],
    boostFields: Record<string, number>,
    fuzzyMultiplier: number
  ): void {
    // Process exact matches
    for (const [docId, fieldFrequencies] of exactMatches.entries()) {
      let docScore = 0;
      let relevantFields = false;
      
      // Check if the match is in the requested fields
      for (const [field, frequency] of fieldFrequencies.entries()) {
        if (fields.length === 0 || fields.includes(field)) {
          relevantFields = true;
          const fieldBoost = boostFields[field] || 1;
          docScore += frequency * fieldBoost;
        }
      }
      
      if (relevantFields) {
        const document = this.documents.get(docId);
        if (document) {
          // TF-IDF like scoring: term frequency / document length
          const normalizedScore = docScore / Math.sqrt(document.tokenCount);
          const currentScore = documentScores.get(docId) || 0;
          documentScores.set(docId, currentScore + normalizedScore);
          matchingDocIds.add(docId);
        }
      }
    }
    
    // Process fuzzy matches with lower weights
    for (const [docId, fieldFrequencies] of fuzzyMatches.entries()) {
      let docScore = 0;
      let relevantFields = false;
      
      for (const [field, frequency] of fieldFrequencies.entries()) {
        if (fields.length === 0 || fields.includes(field)) {
          relevantFields = true;
          const fieldBoost = boostFields[field] || 1;
          docScore += frequency * fieldBoost * fuzzyMultiplier;
        }
      }
      
      if (relevantFields) {
        const document = this.documents.get(docId);
        if (document) {
          const normalizedScore = docScore / Math.sqrt(document.tokenCount);
          const currentScore = documentScores.get(docId) || 0;
          documentScores.set(docId, currentScore + normalizedScore);
          matchingDocIds.add(docId);
        }
      }
    }
  }
  
  /**
   * Find documents that match a specific term
   * Returns a map of document IDs to field frequencies
   */
  private findTermMatches(term: string): Map<string, Map<string, number>> {
    const matches: Map<string, Map<string, number>> = new Map();
    
    const indexedTerm = this.invertedIndex.get(term);
    if (indexedTerm) {
      for (const [docId, frequency] of indexedTerm.documentIds.entries()) {
        const document = this.documents.get(docId);
        if (document) {
          const fieldFrequencies: Map<string, number> = new Map();
          
          // Determine which fields contain this term
          for (const [field, content] of document.fields.entries()) {
            if (this.tokenize(content).map(t => this.stemWord(t)).includes(term)) {
              fieldFrequencies.set(field, frequency);
            }
          }
          
          matches.set(docId, fieldFrequencies);
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Find documents that match a phrase
   */
  private findPhraseMatches(phrase: string, fields: string[]): Map<string, number> {
    const matches: Map<string, number> = new Map();
    const phraseTokens = this.tokenize(phrase).map(t => this.stemWord(t));
    
    // Skip if phrase has only stop words or is too short
    if (phraseTokens.length === 0 || phraseTokens.every(t => this.isStopWord(t))) {
      return matches;
    }
    
    // Start with documents that contain the first term
    const firstTerm = phraseTokens[0];
    const indexedTerm = this.invertedIndex.get(firstTerm);
    
    if (!indexedTerm) return matches;
    
    // For each document that contains the first term, check if it contains the whole phrase
    for (const docId of indexedTerm.documentIds.keys()) {
      const document = this.documents.get(docId);
      if (!document) continue;
      
      for (const [field, content] of document.fields.entries()) {
        // Skip if field is not in the requested fields
        if (fields.length > 0 && !fields.includes(field)) continue;
        
        // Check if the field contains the phrase
        const normalizedContent = content.toLowerCase();
        if (normalizedContent.includes(phrase.toLowerCase())) {
          const currentScore = matches.get(docId) || 0;
          // Phrase matches get a higher score
          matches.set(docId, currentScore + phraseTokens.length * 2);
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Find terms that are similar to the given term (fuzzy matching)
   */
  private findFuzzyMatches(term: string, maxDistance: number): Map<string, Map<string, number>> {
    const matches: Map<string, Map<string, number>> = new Map();
    
    // Check each term in the index for similarity
    for (const [indexTerm, indexedTerm] of this.invertedIndex.entries()) {
      // Skip exact matches as they're handled separately
      if (indexTerm === term) continue;
      
      const distance = this.levenshteinDistance(term, indexTerm);
      
      // If terms are similar enough
      if (distance <= maxDistance) {
        // Calculate a similarity score (1.0 for exact match, decreasing with distance)
        const similarityScore = 1.0 - (distance / Math.max(term.length, indexTerm.length));
        
        // For each document containing the similar term
        for (const [docId, frequency] of indexedTerm.documentIds.entries()) {
          if (!matches.has(docId)) {
            matches.set(docId, new Map());
          }
          
          const document = this.documents.get(docId);
          if (document) {
            // Determine which fields contain this term
            for (const [field, content] of document.fields.entries()) {
              if (this.tokenize(content).map(t => this.stemWord(t)).includes(indexTerm)) {
                const fieldMap = matches.get(docId)!;
                const currentFreq = fieldMap.get(field) || 0;
                // Weight the frequency by similarity score
                fieldMap.set(field, currentFreq + frequency * similarityScore);
              }
            }
          }
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Generate highlighted snippets for search results
   */
  private generateHighlights(
    entity: BaseEntity, 
    tokens: string[], 
    phrases: string[]
  ): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    
    // Process searchable fields
    for (const [key, value] of Object.entries(entity)) {
      if (this.isSearchableField(key, value)) {
        const fieldContent = this.normalizeFieldContent(value);
        const highlightSnippets: string[] = [];
        
        // Look for token matches
        for (const token of tokens) {
          if (this.isStopWord(token)) continue;
          
          const tokenRegex = new RegExp(`\\b${this.escapeRegExp(token)}\\b`, 'gi');
          const matches = fieldContent.match(tokenRegex);
          
          if (matches && matches.length > 0) {
            // Extract snippet around match
            for (const match of matches) {
              const matchIndex = fieldContent.toLowerCase().indexOf(match.toLowerCase());
              if (matchIndex >= 0) {
                const start = Math.max(0, matchIndex - 30);
                const end = Math.min(fieldContent.length, matchIndex + match.length + 30);
                let snippet = fieldContent.substring(start, end);
                
                // Add ellipsis for truncated content
                if (start > 0) snippet = '...' + snippet;
                if (end < fieldContent.length) snippet = snippet + '...';
                
                // Highlight the matching term with bold
                const highlightedSnippet = snippet.replace(
                  new RegExp(`\\b${this.escapeRegExp(match)}\\b`, 'gi'), 
                  '<b>$&</b>'
                );
                
                highlightSnippets.push(highlightedSnippet);
                
                // Limit to 3 snippets per field
                if (highlightSnippets.length >= 3) break;
              }
            }
          }
        }
        
        // Look for phrase matches
        for (const phrase of phrases) {
          const phraseRegex = new RegExp(this.escapeRegExp(phrase), 'gi');
          const matches = fieldContent.match(phraseRegex);
          
          if (matches && matches.length > 0) {
            for (const match of matches) {
              const matchIndex = fieldContent.toLowerCase().indexOf(match.toLowerCase());
              if (matchIndex >= 0) {
                const start = Math.max(0, matchIndex - 30);
                const end = Math.min(fieldContent.length, matchIndex + match.length + 30);
                let snippet = fieldContent.substring(start, end);
                
                if (start > 0) snippet = '...' + snippet;
                if (end < fieldContent.length) snippet = snippet + '...';
                
                const highlightedSnippet = snippet.replace(
                  new RegExp(this.escapeRegExp(match), 'gi'), 
                  '<b>$&</b>'
                );
                
                highlightSnippets.push(highlightedSnippet);
                
                if (highlightSnippets.length >= 3) break;
              }
            }
          }
        }
        
        // Add unique snippets to highlights
        if (highlightSnippets.length > 0) {
          // Remove duplicates
          highlights[key] = [...new Set(highlightSnippets)];
        }
      }
    }
    
    return highlights;
  }
  
  /**
   * Escape special characters for use in regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Parse a search query into tokens, phrases, and excluded terms
   */
  private parseQuery(
    query: string,
    useBooleanOperators: boolean
  ): { tokens: string[], phrases: string[], excludeTerms: string[] } {
    const tokens: string[] = [];
    const phrases: string[] = [];
    const excludeTerms: string[] = [];
    
    // Extract phrases (text in quotes)
    const phraseRegex = /"([^"]*)"/g;
    let match;
    let processedQuery = query;
    
    while ((match = phraseRegex.exec(query)) !== null) {
      if (match[1].trim()) {
        phrases.push(match[1].trim());
      }
      
      // Remove the phrase from the query to avoid double processing
      processedQuery = processedQuery.replace(match[0], ' ');
    }
    
    // Process remaining tokens
    const remainingTokens = processedQuery.split(/\s+/).filter(t => t.trim());
    
    for (let token of remainingTokens) {
      // Handle boolean operators if enabled
      if (useBooleanOperators) {
        // Handle NOT operator (-)
        if (token.startsWith('-') && token.length > 1) {
          excludeTerms.push(token.substring(1).toLowerCase());
          continue;
        }
        
        // Handle AND operator (+) - just include the token without the +
        if (token.startsWith('+') && token.length > 1) {
          token = token.substring(1);
        }
        
        // Skip OR operator as it's the default behavior
        if (token === 'OR') continue;
        if (token === 'AND') continue;
        if (token === 'NOT') continue;
      }
      
      // Add normalized token
      if (token.trim()) {
        tokens.push(token.toLowerCase().trim());
      }
    }
    
    return { tokens, phrases, excludeTerms };
  }
  
  /**
   * Determine if a field is searchable
   */
  private isSearchableField(key: string, value: any): boolean {
    return (
      this.defaultSearchableFields.has(key) ||
      (typeof value === 'string' && value.length > 0) ||
      (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string')
    );
  }
  
  /**
   * Normalize field content for indexing
   */
  private normalizeFieldContent(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.filter(v => typeof v === 'string').join(' ');
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return String(value);
  }
  
  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric with spaces
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
  
  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    return STOP_WORDS.has(word.toLowerCase());
  }
  
  /**
   * Stem a word to its root form (simple implementation)
   */
  private stemWord(word: string): string {
    // Simple stemming: remove common suffixes
    let stem = word.toLowerCase();
    
    // Very basic stemming rules (a more comprehensive algorithm like Porter Stemmer would be better)
    if (stem.endsWith('ing')) stem = stem.slice(0, -3);
    else if (stem.endsWith('ed')) stem = stem.slice(0, -2);
    else if (stem.endsWith('s')) stem = stem.slice(0, -1);
    else if (stem.endsWith('ly')) stem = stem.slice(0, -2);
    else if (stem.endsWith('ies')) stem = stem.slice(0, -3) + 'y';
    else if (stem.endsWith('es')) stem = stem.slice(0, -2);
    else if (stem.endsWith('ment')) stem = stem.slice(0, -4);
    
    return stem;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * (for fuzzy matching)
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
}

// Export singleton instance
export const fullTextSearchManager = new FullTextSearchManager();
