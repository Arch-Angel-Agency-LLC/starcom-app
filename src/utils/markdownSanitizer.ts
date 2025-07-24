/**
 * Markdown Sanitization Utility
 * 
 * Provides safe markdown rendering by sanitizing HTML and preventing XSS attacks
 * while preserving intelligence-specific features like classifications and wikilinks.
 */

interface MarkdownSanitizeOptions {
  allowWikilinks?: boolean;
  allowClassifications?: boolean;
  allowCoordinates?: boolean;
  allowCustomTags?: boolean;
  preserveLineBreaks?: boolean;
}

class MarkdownSanitizer {
  private defaultOptions: MarkdownSanitizeOptions = {
    allowWikilinks: true,
    allowClassifications: true,
    allowCoordinates: true,
    allowCustomTags: false,
    preserveLineBreaks: true
  };

  /**
   * Sanitize markdown content to prevent XSS while preserving intelligence features
   */
  sanitizeMarkdown(content: string, options?: MarkdownSanitizeOptions): string {
    const opts = { ...this.defaultOptions, ...options };
    
    // First pass: escape dangerous patterns
    let sanitized = this.escapeHtmlEntities(content);
    
    // Preserve wikilinks if allowed
    if (opts.allowWikilinks) {
      sanitized = this.sanitizeWikilinks(sanitized);
    } else {
      sanitized = this.removeWikilinks(sanitized);
    }
    
    // Preserve classification tags if allowed
    if (opts.allowClassifications) {
      sanitized = this.sanitizeClassificationTags(sanitized);
    }
    
    // Preserve coordinates if allowed
    if (opts.allowCoordinates) {
      sanitized = this.sanitizeCoordinates(sanitized);
    }
    
    // Remove dangerous script tags and on* attributes
    sanitized = this.removeDangerousContent(sanitized);
    
    // Sanitize any HTML content
    sanitized = this.sanitizeHtml(sanitized);
    
    return sanitized;
  }

  /**
   * Sanitize HTML content (simplified version without DOMPurify)
   */
  sanitizeHtml(html: string): string {
    // Remove all script and dangerous tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<object\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<form\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<input\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<button\b[^>]*>/gi, '');
    
    // Remove on* event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']?/gi, '');
    
    // Remove javascript: and data: URLs
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']?/gi, 'href="#"');
    sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']?/gi, 'src=""');
    
    return sanitized;
  }

  /**
   * Escape HTML entities to prevent XSS
   */
  private escapeHtmlEntities(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
  }

  /**
   * Sanitize wikilinks to prevent injection while preserving functionality
   */
  private sanitizeWikilinks(content: string): string {
    // Match [[filename]] or [[filename|display text]] patterns
    return content.replace(/\[\[([^|]+)(\|([^\]]+))?\]\]/g, (match, filename, _pipe, displayText) => {
      // Sanitize filename and display text
      const safeFilename = this.sanitizeFilename(filename);
      const safeDisplayText = displayText ? this.escapeHtmlEntities(displayText.trim()) : safeFilename;
      
      // Return safe wikilink
      return `<a href="#" class="wikilink" data-target="${safeFilename}">${safeDisplayText}</a>`;
    });
  }

  /**
   * Remove wikilinks entirely
   */
  private removeWikilinks(content: string): string {
    return content.replace(/\[\[([^|]+)(\|([^\]]+))?\]\]/g, (match, filename, _pipe, displayText) => {
      return displayText ? displayText.trim() : filename.trim();
    });
  }

  /**
   * Sanitize classification tags
   */
  private sanitizeClassificationTags(content: string): string {
    const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    
    return content.replace(/#([A-Z_]+)/g, (match, classification) => {
      if (validClassifications.includes(classification)) {
        return `<span class="classification-tag" data-classification="${classification}">${match}</span>`;
      }
      return match; // Return as-is if not a valid classification
    });
  }

  /**
   * Sanitize coordinate patterns
   */
  private sanitizeCoordinates(content: string): string {
    // Match coordinate patterns like (40.7128, -74.0060) or [40.7128, -74.0060]
    return content.replace(/[([](-?\d+\.?\d*),\s*(-?\d+\.?\d*)[)\]]/g, (match, lat, lng) => {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Validate coordinate ranges
      if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        return `<span class="coordinate" data-coordinate="${latitude},${longitude}">${match}</span>`;
      }
      
      return match; // Return as-is if invalid coordinates
    });
  }

  /**
   * Remove dangerous content patterns
   */
  private removeDangerousContent(content: string): string {
    // Remove javascript: URLs
    content = content.replace(/javascript:/gi, 'javascript-blocked:');
    
    // Remove data: URLs that could contain scripts
    content = content.replace(/data:[^;]*;base64/gi, 'data-blocked:');
    
    // Remove vbscript: URLs
    content = content.replace(/vbscript:/gi, 'vbscript-blocked:');
    
    // Remove on* event handlers
    content = content.replace(/\son\w+\s*=/gi, ' data-blocked=');
    
    // Remove script tags
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove style tags with potential CSS injection
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    return content;
  }

  /**
   * Sanitize filename for safe use in DOM
   */
  private sanitizeFilename(filename: string): string {
    // Remove dangerous characters and normalize
    return filename
      .trim()
      .replace(/[<>:"'/\\|?*]/g, '') // Remove dangerous chars  
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  }

  /**
   * Validate that content is safe for rendering
   */
  isContentSafe(content: string): boolean {
    // Check for obvious XSS patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract and sanitize frontmatter
   */
  sanitizeFrontmatter(frontmatter: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(frontmatter)) {
      // Sanitize key
      const safeKey = this.sanitizeFilename(key);
      
      // Sanitize value based on type
      if (typeof value === 'string') {
        sanitized[safeKey] = this.escapeHtmlEntities(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[safeKey] = value;
      } else if (Array.isArray(value)) {
        sanitized[safeKey] = value.map(item => 
          typeof item === 'string' ? this.escapeHtmlEntities(item) : item
        );
      } else if (value && typeof value === 'object') {
        sanitized[safeKey] = this.sanitizeFrontmatter(value as Record<string, unknown>);
      }
    }
    
    return sanitized;
  }
}

// Singleton instance
export const markdownSanitizer = new MarkdownSanitizer();
export default MarkdownSanitizer;
