/**
 * IntelWeb Implementation Starting Point
 * 
 * Phase 2 First: Vault System Foundation
 * Ready to begin development
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IntelReportPackage } from '../../types/IntelReportPackage';
import { VirtualFileSystem, VirtualFile } from '../../types/DataPack';
import { VirtualFileSystemManager } from '../../services/VirtualFileSystemManager';
import { IntelGraph } from './components/Graph/IntelGraph';
import GraphErrorBoundary from './components/ErrorBoundary/GraphErrorBoundary';
import { markdownSanitizer } from '../../utils/markdownSanitizer';
import './components/ErrorBoundary/GraphErrorBoundary.css';

// Tree structure for file explorer
interface TreeNode {
  [key: string]: VirtualFile | TreeNode;
}

// Type guard and utility functions
const isVirtualFile = (value: VirtualFile | TreeNode): value is VirtualFile => {
  return (value as VirtualFile).path !== undefined;
};

const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];

const isValidClassification = (value: unknown): value is string => {
  return typeof value === 'string' && validClassifications.includes(value);
};

const isValidConfidence = (value: unknown): value is number => {
  return typeof value === 'number' && value >= 0 && value <= 1;
};

const getValidClassification = (frontmatter: Record<string, unknown> | undefined): string => {
  if (frontmatter && isValidClassification(frontmatter.classification)) {
    return frontmatter.classification;
  }
  return 'UNCLASSIFIED';
};

const _getValidConfidence = (frontmatter: Record<string, unknown> | undefined): number => {
  if (frontmatter && isValidConfidence(frontmatter.confidence)) {
    return frontmatter.confidence;
  }
  return 0;
};

interface IntelWebApplicationProps {
  packageId?: string;
  initialPackage?: IntelReportPackage;
}

interface IntelWebState {
  currentPackage: IntelReportPackage | null;
  vault: VirtualFileSystem | null;
  selectedFile: VirtualFile | null;
  viewMode: 'list' | 'graph';
  loading: boolean;
  error: string | null;
}

export const IntelWebApplication: React.FC<IntelWebApplicationProps> = ({
  initialPackage
}) => {
  const [state, setState] = useState<IntelWebState>({
    currentPackage: null,
    vault: null,
    selectedFile: null,
    viewMode: 'list',
    loading: false, // Start with loading false, only set to true when actually loading a package
    error: null
  });

  // Phase 2 Week 1: Basic package loading with AbortController and mount safety
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadPackage = useCallback(async (pkg: IntelReportPackage) => {
    // Abort any previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!isMountedRef.current) return;
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Use VirtualFileSystemManager to load the DataPack
      const vfsManager = new VirtualFileSystemManager();
      const result = await vfsManager.loadDataPack(pkg.dataPack);
      
      // Check if operation was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (!result.success || !result.virtualFileSystem) {
        throw new Error('Failed to load virtual filesystem');
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          currentPackage: pkg,
          vault: result.virtualFileSystem!,
          loading: false
        }));
      }
    } catch (error) {
      // Only update state if component is still mounted and not aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load package',
          loading: false
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (initialPackage) {
      loadPackage(initialPackage);
    } else {
      // No initial package provided, go directly to empty state
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [initialPackage, loadPackage]);

  // Demo vault loader for testing (simplified version)
  const loadDemoVault = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Create a simple demo virtual file system
      const demoFiles = new Map<string, VirtualFile>([
        ['operations/operation-nightfall.md', {
          path: 'operations/operation-nightfall.md',
          name: 'operation-nightfall.md',
          extension: 'md',
          size: 1024,
          mimeType: 'text/markdown',
          encoding: 'utf-8',
          hash: 'demo-hash-001',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          content: `---
classification: SECRET
confidence: 0.85
sources: 
  - HUMINT-2024-0157
  - OSINT-Social-Media
coordinates: [40.7128, -74.0060]
entities:
  - Acme Corporation
  - John Doe
tags: [operations, surveillance, new-york]
---

# Operation Nightfall - Status Report

## Summary
Intelligence indicates [[Acme Corporation]] is conducting suspicious activities in [[New York City]].

## Key Findings
- Financial transfers to offshore accounts
- Meetings with known associates
- Increased security at facilities

## Assessment
Confidence: **85%** based on multiple HUMINT sources.
Classification: **SECRET** - restricted distribution.

## Geolocation
Coordinates: \`40.7128, -74.0060\` (Manhattan)`,
          frontmatter: {
            classification: 'SECRET',
            confidence: 0.85,
            sources: ['HUMINT-2024-0157', 'OSINT-Social-Media'],
            coordinates: [40.7128, -74.0060],
            entities: ['Acme Corporation', 'John Doe'],
            tags: ['operations', 'surveillance', 'new-york']
          },
          relationships: []
        }],
        ['entities/acme-corp.md', {
          path: 'entities/acme-corp.md',
          name: 'acme-corp.md',
          extension: 'md',
          size: 512,
          mimeType: 'text/markdown',
          encoding: 'utf-8',
          hash: 'demo-hash-002',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          content: `---
classification: CONFIDENTIAL
confidence: 0.75
type: organization
tags: [entities, corporations, surveillance]
---

# Acme Corporation

## Overview
Multi-national corporation with suspicious financial patterns.

## Key Personnel
- [[John Doe]] - CEO
- [[Jane Smith]] - CFO

## Related Operations
- [[Operation Nightfall]] - Primary surveillance target`,
          frontmatter: {
            classification: 'CONFIDENTIAL',
            confidence: 0.75,
            type: 'organization',
            tags: ['entities', 'corporations', 'surveillance']
          },
          relationships: []
        }],
        ['analysis/threat-assessment.md', {
          path: 'analysis/threat-assessment.md',
          name: 'threat-assessment.md',
          extension: 'md',
          size: 768,
          mimeType: 'text/markdown',
          encoding: 'utf-8',
          hash: 'demo-hash-003',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          content: `---
classification: SECRET
confidence: 0.90
tags: [analysis, threat-assessment, intelligence]
---

# Threat Assessment - Q3 2025

## Executive Summary
Current threat level: **ELEVATED**

## Key Threats
1. [[Acme Corporation]] - Corporate espionage
2. Cyber intrusions - Foreign state actors
3. Supply chain vulnerabilities

## Recommendations
- Enhanced surveillance of [[Operation Nightfall]] targets
- Increased cybersecurity monitoring
- Supply chain audits`,
          frontmatter: {
            classification: 'SECRET',
            confidence: 0.90,
            tags: ['analysis', 'threat-assessment', 'intelligence']
          },
          relationships: []
        }]
      ]);
      
      // Create demo virtual file system
      const demoVault: VirtualFileSystem = {
        root: {
          path: '',
          name: 'root',
          children: ['operations/', 'entities/', 'analysis/'],
          files: [],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        },
        fileIndex: demoFiles,
        directoryIndex: new Map([
          ['operations/', {
            path: 'operations/',
            name: 'operations',
            children: [],
            files: ['operations/operation-nightfall.md'],
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          }],
          ['entities/', {
            path: 'entities/',
            name: 'entities',
            children: [],
            files: ['entities/acme-corp.md'],
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          }],
          ['analysis/', {
            path: 'analysis/',
            name: 'analysis',
            children: [],
            files: ['analysis/threat-assessment.md'],
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          }]
        ]),
        relationshipGraph: []
      };
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update state with demo vault
      setState(prev => ({
        ...prev,
        vault: demoVault,
        loading: false,
        currentPackage: null // No package, just demo vault
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load demo vault',
        loading: false
      }));
    }
  }, []);

  if (state.loading) {
    return (
      <div className="intelweb-loading">
        <div className="loading-spinner">Loading Intelligence Vault...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="intelweb-error">
        <div className="error-message">Error: {state.error}</div>
        <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
          Retry
        </button>
      </div>
    );
  }

  if (!state.vault) {
    return (
      <div className="intelweb-empty">
        <div className="empty-state">
          <h2>IntelWeb - Intelligence Vault Explorer</h2>
          <p>Load an Intelligence Package to begin analysis</p>
          <div className="demo-actions">
            <button className="demo-button" onClick={loadDemoVault}>
              📁 Load Demo Intelligence Vault
            </button>
            <p className="demo-description">
              Contains sample intelligence reports, entities, and analysis documents
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2 Implementation: Basic three-pane layout
  return (
    <div className="intelweb-application">
      <div className="intelweb-layout">
        {/* Left Sidebar - Vault Explorer */}
        <div className="left-sidebar">
          <VaultExplorer 
            vault={state.vault}
            selectedFile={state.selectedFile}
            onFileSelect={(file) => setState(prev => ({ ...prev, selectedFile: file }))}
          />
        </div>

        {/* Main Content - Graph/Editor */}
        <div className="main-content">
          {/* View Mode Toggle */}
          <div className="view-toggle" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 100,
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
              style={{
                padding: '6px 12px',
                backgroundColor: state.viewMode === 'list' ? 'var(--intel-accent)' : 'var(--intel-bg-secondary)',
                color: state.viewMode === 'list' ? 'white' : 'var(--intel-text)',
                border: '1px solid var(--intel-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              📄 Files
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'graph' }))}
              style={{
                padding: '6px 12px',
                backgroundColor: state.viewMode === 'graph' ? 'var(--intel-accent)' : 'var(--intel-bg-secondary)',
                color: state.viewMode === 'graph' ? 'white' : 'var(--intel-text)',
                border: '1px solid var(--intel-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🕸️ Graph
            </button>
          </div>

          {/* Content Area */}
          {state.viewMode === 'graph' ? (
            <GraphErrorBoundary>
              <IntelGraph
                vault={state.vault}
                selectedFile={state.selectedFile}
                onFileSelect={(file) => setState(prev => ({ ...prev, selectedFile: file }))}
                className="intelligence-graph"
              />
            </GraphErrorBoundary>
          ) : state.selectedFile ? (
            <FileViewer file={state.selectedFile} vault={state.vault} />
          ) : (
            <div className="welcome-content">
              <h2>Intelligence Vault Loaded</h2>
              <p>Select a file from the vault explorer to begin analysis</p>
              <p>Total files: {state.vault.fileIndex.size}</p>
              <p>Switch to Graph view to see intelligence relationships</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Metadata */}
        <div className="right-sidebar">
          <MetadataPanel 
            file={state.selectedFile}
            vault={state.vault}
          />
        </div>
      </div>
    </div>
  );
};

// Phase 2 Component: Vault Explorer (Week 1 Priority)
interface VaultExplorerProps {
  vault: VirtualFileSystem;
  selectedFile: VirtualFile | null;
  onFileSelect: (file: VirtualFile) => void;
}

const VaultExplorer: React.FC<VaultExplorerProps> = ({
  vault,
  selectedFile,
  onFileSelect
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build file tree structure
  const buildFileTree = () => {
    interface TreeNode {
      [key: string]: VirtualFile | TreeNode;
    }
    const tree: TreeNode = {};
    
    Array.from(vault.fileIndex.values()).forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? file : {};
        }
        if (index < parts.length - 1 && typeof current[part] === 'object') {
          current = current[part] as TreeNode;
        }
      });
    });
    
    return tree;
  };

  const renderFileTree = (tree: TreeNode, path = '', depth = 0): React.ReactNode[] => {
    return Object.entries(tree).map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFile = isVirtualFile(value);
      const isExpanded = expandedFolders.has(fullPath);
      
      if (isFile) {
        const file = value;
        const isSelected = selectedFile?.path === file.path;
        
        return (
          <div 
            key={file.path}
            className={`file-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${depth * 16}px` }}
            onClick={() => onFileSelect(file)}
          >
            <span className="file-icon">📄</span>
            <span className="file-name">{name}</span>
            {file.frontmatter?.classification && (
              <span className={`classification ${getValidClassification(file.frontmatter).toLowerCase()}`}>
                {getValidClassification(file.frontmatter)}
              </span>
            )}
          </div>
        );
      } else {
        // Folder
        return (
          <div key={fullPath}>
            <div 
              className="folder-item"
              style={{ paddingLeft: `${depth * 16}px` }}
              onClick={() => {
                const newExpanded = new Set(expandedFolders);
                if (isExpanded) {
                  newExpanded.delete(fullPath);
                } else {
                  newExpanded.add(fullPath);
                }
                setExpandedFolders(newExpanded);
              }}
            >
              <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
              <span className="folder-name">{name}</span>
            </div>
            {isExpanded && typeof value === 'object' && !isVirtualFile(value) && (
              <div className="folder-contents">
                {renderFileTree(value as TreeNode, fullPath, depth + 1)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  return (
    <div className="vault-explorer">
      <div className="vault-header">
        <h3>Intelligence Vault</h3>
        <div className="vault-stats">
          {vault.fileIndex.size} files
        </div>
      </div>
      <div className="file-tree">
        {renderFileTree(buildFileTree())}
      </div>
    </div>
  );
};

// Basic File Viewer (Week 1 Implementation)
interface FileViewerProps {
  file: VirtualFile;
  vault: VirtualFileSystem;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, vault: _vault }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isMarkdown, setIsMarkdown] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        
        // Check if file is markdown
        const isMarkdownFile = file.path.endsWith('.md') || file.mimeType === 'text/markdown';
        setIsMarkdown(isMarkdownFile);
        
        if (file.content) {
          // Ensure content is a string
          const contentStr = typeof file.content === 'string' 
            ? file.content 
            : new TextDecoder().decode(file.content);
            
          // File has content, process it
          if (isMarkdownFile) {
            // Sanitize markdown content for security
            const sanitizedContent = markdownSanitizer.sanitizeMarkdown(contentStr);
            setContent(sanitizedContent);
          } else {
            // For non-markdown files, display as plain text
            setContent(contentStr);
          }
        } else {
          // Fallback for files without content
          setContent(`File: ${file.path}\nSize: ${file.size} bytes\nType: ${file.mimeType || 'unknown'}\n\nContent not available in current implementation.`);
        }
      } catch (error) {
        setContent(`Error loading file: ${error}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  }, [file]);

  if (loading) {
    return <div className="file-loading">Loading file...</div>;
  }

  return (
    <div className="file-viewer">
      <div className="file-header">
        <h3>{file.path.split('/').pop()}</h3>
        <div className="file-info">
          {file.frontmatter?.classification && (
            <span className={`classification ${getValidClassification(file.frontmatter).toLowerCase()}`}>
              {getValidClassification(file.frontmatter)}
            </span>
          )}
          {isMarkdown && (
            <span className="file-type">📄 Markdown</span>
          )}
        </div>
      </div>
      <div className="file-content">
        {isMarkdown ? (
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <pre>{content}</pre>
        )}
      </div>
    </div>
  );
};

// Basic Metadata Panel
interface MetadataPanelProps {
  file: VirtualFile | null;
  vault: VirtualFileSystem | null;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="metadata-panel">
        <h3>Properties</h3>
        <p>Select a file to view metadata</p>
      </div>
    );
  }

  return (
    <div className="metadata-panel">
      <h3>Properties</h3>
      <div className="metadata-item">
        <label>File:</label>
        <span>{file.path.split('/').pop()}</span>
      </div>
      <div className="metadata-item">
        <label>Size:</label>
        <span>{file.size} bytes</span>
      </div>
      <div className="metadata-item">
        <label>Type:</label>
        <span>{file.mimeType || 'unknown'}</span>
      </div>
      {file.frontmatter?.classification && (
        <div className="metadata-item">
          <label>Classification:</label>
          <span className={`classification ${
            typeof file.frontmatter.classification === 'string' 
              ? file.frontmatter.classification.toLowerCase() 
              : 'unclassified'
          }`}>
            {typeof file.frontmatter.classification === 'string' 
              ? file.frontmatter.classification 
              : 'UNCLASSIFIED'}
          </span>
        </div>
      )}
      {file.frontmatter?.confidence && (
        <div className="metadata-item">
          <label>Confidence:</label>
          <span>{
            (typeof file.frontmatter.confidence === 'number' && 
             file.frontmatter.confidence >= 0 && 
             file.frontmatter.confidence <= 1
              ? file.frontmatter.confidence * 100 
              : 0
            ).toFixed(0)
          }%</span>
        </div>
      )}
    </div>
  );
};

export default IntelWebApplication;
