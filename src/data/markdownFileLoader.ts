/**
 * Markdown File Loader for Demo Investigation Data
 * 
 * This module provides access to demo markdown content for 
 * intelligence analysis demonstrations
 */

// Demo markdown content for development and testing
export const markdownContentMap: Record<string, string> = {
  'People/Demo Person Alpha.md': `# Demo Person Alpha

Age: 25
Location: Demo City
Occupation: Software Engineer

## Background
Demo Person Alpha is a fictional character created for intelligence analysis demonstration purposes. 

## Connections
- Connected to [[Demo Organization Beta]]
- Works with [[Demo Person Gamma]]
- Lives in [[Demo Location Delta]]

## Notes
This is sample investigative data for demonstration purposes only. No real individuals are represented in this data.

#demo #person #investigation`,

  'People/Demo Person Beta.md': `# Demo Person Beta

Age: 30
Location: Demo City
Occupation: Project Manager

## Background
Demo Person Beta is another fictional character for testing intelligence analysis workflows.

## Connections
- Manages [[Demo Person Alpha]]
- Associates with [[Demo Organization Echo]]
- Frequent visitor to [[Demo Location Foxtrot]]

## Analysis Notes
Sample analytical notes about connections and patterns. This demonstrates how intelligence analysts might document relationships and observations.

#demo #person #management`,

  'Organizations/Demo Organization Alpha.md': `# Demo Organization Alpha

Type: Technology Company
Location: Demo City Business District
Founded: 2020

## Overview
A fictional organization created for intelligence analysis demonstration and testing.

## Key Personnel
- [[Demo Person Alpha]] - Software Engineer
- [[Demo Person Beta]] - Project Manager

## Operations
Sample operational data for demonstration purposes.

#demo #organization #technology`,
};

/**
 * Get the actual markdown content for a given file path
 */
export function getMarkdownContent(relativePath: string): string | null {
  const content = markdownContentMap[relativePath];
  if (content) {
    console.log(`✅ Found real markdown content for ${relativePath}: ${content.length} characters`);
    return content;
  }
  
  console.warn(`⚠️ No markdown content found for ${relativePath}`);
  return null;
}

/**
 * Get all available file paths
 */
export function getAvailableFiles(): string[] {
  return Object.keys(markdownContentMap);
}

/**
 * Check if a file has real content available
 */
export function hasRealContent(relativePath: string): boolean {
  return relativePath in markdownContentMap;
}
