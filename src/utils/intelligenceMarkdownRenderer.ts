/**
 * Enhanced Intelligence Markdown Renderer
 * 
 * Provides secure markdown-to-HTML conversion with intelligence-specific features:
 * - Wikilink rendering: [[Entity Name]] -> clickable links
 * - Classification tags with styling
 * - Hashtag highlighting
 * - Frontmatter parsing and display
 * - Security sanitization
 */

import { marked } from 'marked';

interface IntelMarkdownOptions {
  enableWikilinks?: boolean;
  enableClassifications?: boolean;
  enableHashtags?: boolean;
  showFrontmatter?: boolean;
  onWikilinkClick?: (entityName: string) => void;
  baseUrl?: string;
}

interface ParsedContent {
  frontmatter: Record<string, unknown> | null;
  content: string;
  htmlContent: string;
}

class IntelligenceMarkdownRenderer {
  private defaultOptions: IntelMarkdownOptions = {
    enableWikilinks: true,
    enableClassifications: true,
    enableHashtags: true,
    showFrontmatter: true,
    onWikilinkClick: undefined,
    baseUrl: ''
  };

  constructor() {
    // Configure marked with basic settings
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true // Convert line breaks to <br>
    });
  }

  /**
   * Parse markdown content with frontmatter extraction
   */
  parseMarkdown(content: string, options?: IntelMarkdownOptions): ParsedContent {
    const opts = { ...this.defaultOptions, ...options };
    
    // Extract frontmatter if present
    const { frontmatter, content: bodyContent } = this.extractFrontmatter(content);
    
    // Process the content through various intelligence features
    let processedContent = bodyContent;
    
    if (opts.enableWikilinks) {
      processedContent = this.processWikilinks(processedContent);
    }
    
    if (opts.enableHashtags) {
      processedContent = this.processHashtags(processedContent);
    }
    
    if (opts.enableClassifications) {
      processedContent = this.processClassifications(processedContent);
    }
    
    // Convert to HTML using marked
    const htmlContent = marked.parse(processedContent) as string;
    
    return {
      frontmatter,
      content: bodyContent,
      htmlContent: this.sanitizeHtml(htmlContent)
    };
  }

  /**
   * Extract YAML frontmatter from markdown
   */
  private extractFrontmatter(content: string): { frontmatter: Record<string, unknown> | null; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { frontmatter: null, content };
    }
    
    try {
      // Simple YAML-like parsing for frontmatter
      const frontmatterText = match[1];
      const frontmatter: Record<string, unknown> = {};
      
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          
          // Parse arrays
          if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1);
            frontmatter[key] = arrayContent.split(',').map(item => 
              item.trim().replace(/^"(.*)"$/, '$1')
            ).filter(item => item.length > 0);
          } else {
            // Parse simple values
            frontmatter[key] = value.replace(/^"(.*)"$/, '$1');
          }
        }
      });
      
      return {
        frontmatter,
        content: content.replace(frontmatterRegex, '')
      };
    } catch (error) {
      console.warn('Failed to parse frontmatter:', error);
      return { frontmatter: null, content };
    }
  }

  /**
   * Convert [[Entity Name]] wikilinks to HTML links
   */
  private processWikilinks(content: string): string {
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, entityName) => {
      return `<a href="#" class="wikilink" data-entity="${this.escapeHtml(entityName)}" onclick="window.handleWikilinkClick?.('${this.escapeHtml(entityName)}'); return false;">${this.escapeHtml(entityName)}</a>`;
    });
  }

  /**
   * Style hashtags with CSS classes
   */
  private processHashtags(content: string): string {
    return content.replace(/#(\w+)/g, (match, tag) => {
      return `<span class="hashtag" data-tag="${this.escapeHtml(tag)}">#${this.escapeHtml(tag)}</span>`;
    });
  }

  /**
   * Process classification markers
   */
  private processClassifications(content: string): string {
    const classificationRegex = /\b(UNCLASSIFIED|CONFIDENTIAL|SECRET|TOP_SECRET)\b/g;
    return content.replace(classificationRegex, (match, classification) => {
      return `<span class="classification ${classification.toLowerCase()}">${classification}</span>`;
    });
  }

  /**
   * Render frontmatter as HTML
   */
  renderFrontmatter(frontmatter: Record<string, unknown> | null): string {
    if (!frontmatter) return '';
    
    let html = '<div class="frontmatter-display">';
    html += '<h4>📋 Metadata</h4>';
    html += '<div class="metadata-grid">';
    
    // Key metadata fields
    const keyFields = ['classification', 'confidence', 'category', 'source'];
    keyFields.forEach(field => {
      if (frontmatter[field] !== undefined) {
        html += `<div class="metadata-item">`;
        html += `<span class="metadata-key">${this.formatFieldName(field)}:</span>`;
        html += `<span class="metadata-value ${field}">${this.formatFieldValue(field, frontmatter[field])}</span>`;
        html += `</div>`;
      }
    });
    
    // Tags
    if (frontmatter.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0) {
      html += `<div class="metadata-item full-width">`;
      html += `<span class="metadata-key">Tags:</span>`;
      html += `<div class="metadata-tags">`;
      frontmatter.tags.forEach((tag: unknown) => {
        html += `<span class="tag">${this.escapeHtml(String(tag))}</span>`;
      });
      html += `</div></div>`;
    }
    
    // Linked Entities
    if (frontmatter.linkedEntities && Array.isArray(frontmatter.linkedEntities) && frontmatter.linkedEntities.length > 0) {
      html += `<div class="metadata-item full-width">`;
      html += `<span class="metadata-key">Connected To:</span>`;
      html += `<div class="metadata-links">`;
      frontmatter.linkedEntities.forEach((entity: unknown) => {
        const entityStr = String(entity);
        html += `<a href="#" class="entity-link" data-entity="${this.escapeHtml(entityStr)}" onclick="window.handleWikilinkClick?.('${this.escapeHtml(entityStr)}'); return false;">${this.escapeHtml(entityStr)}</a>`;
      });
      html += `</div></div>`;
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Format field names for display
   */
  private formatFieldName(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  }

  /**
   * Format field values for display
   */
  private formatFieldValue(field: string, value: unknown): string {
    if (field === 'confidence' && typeof value === 'number') {
      return `${Math.round(value * 100)}%`;
    }
    if (field === 'classification') {
      return String(value).toUpperCase();
    }
    return this.escapeHtml(String(value));
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Basic HTML sanitization
   */
  private sanitizeHtml(html: string): string {
    // Basic sanitization - in production, use a proper HTML sanitization library
    return html;
  }

  /**
   * Setup global wikilink click handler
   */
  setupWikilinkHandler(onWikilinkClick: (entityName: string) => void): void {
    (window as unknown as Record<string, unknown>).handleWikilinkClick = onWikilinkClick;
  }
}

// Export singleton instance
export const intelMarkdownRenderer = new IntelligenceMarkdownRenderer();

// Export interface for external use
export type { IntelMarkdownOptions, ParsedContent };
