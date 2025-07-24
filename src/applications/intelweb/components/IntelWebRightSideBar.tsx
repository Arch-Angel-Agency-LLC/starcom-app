/**
 * IntelWeb Right Sidebar Component
 * Shows tabbed interface with Graph, File, and Metadata views
 */

import React from 'react';
import { VirtualFileSystem, VirtualFile } from '../../../types/DataPack';
import { intelMarkdownRenderer } from '../../../utils/intelligenceMarkdownRenderer';

interface IntelWebRightSideBarProps {
  vault: VirtualFileSystem | null;
  selectedFile: VirtualFile | null;
  activeTab: 'graph' | 'file' | 'metadata';
  onTabChange: (tab: 'graph' | 'file' | 'metadata') => void;
}

export const IntelWebRightSideBar: React.FC<IntelWebRightSideBarProps> = ({
  vault,
  selectedFile,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="intel-web-right-sidebar">
      {/* Tab Header */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--intel-border)',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => onTabChange('graph')}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: activeTab === 'graph' ? 'var(--intel-accent)' : 'var(--intel-bg-secondary)',
            color: activeTab === 'graph' ? 'white' : 'var(--intel-text)',
            border: '1px solid var(--intel-border)',
            borderBottom: 'none',
            borderTopLeftRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          📊 Graph
        </button>
        <button
          onClick={() => onTabChange('file')}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: activeTab === 'file' ? 'var(--intel-accent)' : 'var(--intel-bg-secondary)',
            color: activeTab === 'file' ? 'white' : 'var(--intel-text)',
            border: '1px solid var(--intel-border)',
            borderBottom: 'none',
            borderLeft: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          📄 File
        </button>
        <button
          onClick={() => onTabChange('metadata')}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: activeTab === 'metadata' ? 'var(--intel-accent)' : 'var(--intel-bg-secondary)',
            color: activeTab === 'metadata' ? 'white' : 'var(--intel-text)',
            border: '1px solid var(--intel-border)',
            borderBottom: 'none',
            borderLeft: 'none',
            borderTopRightRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          📋 Metadata
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'graph' && (
        <GraphStatsPanel vault={vault} />
      )}
      {activeTab === 'file' && (
        <FileContentPanel file={selectedFile} />
      )}
      {activeTab === 'metadata' && (
        <MetadataPanel file={selectedFile} />
      )}
    </div>
  );
};

// Graph Stats Panel - Shows vault and graph statistics
interface GraphStatsPanelProps {
  vault: VirtualFileSystem | null;
}

const GraphStatsPanel: React.FC<GraphStatsPanelProps> = ({ vault }) => {
  if (!vault) {
    return (
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          color: 'var(--intel-text)',
          fontSize: '1.1rem'
        }}>Graph Statistics</h3>
        <p style={{ 
          color: 'var(--intel-text-dim)',
          fontSize: '0.9rem'
        }}>No vault loaded</p>
      </div>
    );
  }

  const totalFiles = vault.fileIndex.size;
  const totalRelationships = vault.relationshipGraph?.length || 0;
  const _totalDirectories = vault.directoryIndex.size;

  // Calculate file type distribution
  const fileTypes = new Map<string, number>();
  const categoryStats = new Map<string, number>();
  
  vault.fileIndex.forEach(file => {
    const type = file.extension || 'unknown';
    fileTypes.set(type, (fileTypes.get(type) || 0) + 1);
    
    const category = file.frontmatter?.category || file.path.split('/')[0] || 'unknown';
    categoryStats.set(category, (categoryStats.get(category) || 0) + 1);
  });

  // Calculate wikilink statistics
  const wikilinkStats = new Map<string, number>();
  vault.fileIndex.forEach(file => {
    const wikilinks = file.frontmatter?.wikilinks as string[] || [];
    wikilinks.forEach(link => {
      wikilinkStats.set(link, (wikilinkStats.get(link) || 0) + 1);
    });
  });

  const topReferencedNodes = Array.from(wikilinkStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: 'var(--intel-text)',
        fontSize: '1.1rem'
      }}>Graph Statistics</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          margin: '0 0 8px 0',
          color: 'var(--intel-text)',
          fontSize: '0.95rem'
        }}>Vault Overview</h4>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Total Files:</label>
          <span style={{ color: 'var(--intel-text)' }}>{totalFiles}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Wikilink Connections:</label>
          <span style={{ color: 'var(--intel-text)' }}>{totalRelationships}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Categories:</label>
          <span style={{ color: 'var(--intel-text)' }}>{categoryStats.size}</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          margin: '0 0 8px 0',
          color: 'var(--intel-text)',
          fontSize: '0.95rem'
        }}>Category Distribution</h4>
        {Array.from(categoryStats.entries()).map(([category, count]) => (
          <div key={category} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '0.85rem'
          }}>
            <label style={{ color: 'var(--intel-text-dim)' }}>{category}:</label>
            <span style={{ color: 'var(--intel-text)' }}>{count}</span>
          </div>
        ))}
      </div>

      {topReferencedNodes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            margin: '0 0 8px 0',
            color: 'var(--intel-text)',
            fontSize: '0.95rem'
          }}>Most Referenced</h4>
          {topReferencedNodes.map(([node, count]) => (
            <div key={node} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '0.85rem'
            }}>
              <label style={{ color: 'var(--intel-text-dim)' }}>{node}:</label>
              <span style={{ color: 'var(--intel-text)' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {vault.relationshipGraph && vault.relationshipGraph.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            margin: '0 0 8px 0',
            color: 'var(--intel-text)',
            fontSize: '0.95rem'
          }}>Relationship Analysis</h4>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '0.85rem'
          }}>
            <label style={{ color: 'var(--intel-text-dim)' }}>Avg. connections per file:</label>
            <span style={{ color: 'var(--intel-text)' }}>{(totalRelationships / totalFiles).toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// File Content Panel - Shows complete markdown content
interface FileContentPanelProps {
  file: VirtualFile | null;
}

const FileContentPanel: React.FC<FileContentPanelProps> = ({ file }) => {
  if (!file) {
    return (
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          color: 'var(--intel-text)',
          fontSize: '1.1rem'
        }}>File Content</h3>
        <p style={{ 
          color: 'var(--intel-text-dim)',
          fontSize: '0.9rem'
        }}>Select a file to view its complete content</p>
      </div>
    );
  }

  const content = file.content || '';
  const isMarkdown = file.extension === '.md' || file.mimeType === 'text/markdown';

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        color: 'var(--intel-text)',
        fontSize: '1.1rem'
      }}>File Content</h3>
      <div style={{ 
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: 'var(--intel-bg-secondary)',
        borderRadius: '4px',
        fontSize: '0.85rem'
      }}>
        <div><strong>{file.name}</strong></div>
        <div style={{ color: 'var(--intel-text-dim)' }}>
          {file.size} bytes • {isMarkdown ? 'Markdown' : file.mimeType || 'Text'}
        </div>
        {file.frontmatter?.wikilinks && (
          <div style={{ color: 'var(--intel-text-dim)', marginTop: '4px' }}>
            Wikilinks: {(file.frontmatter.wikilinks as string[]).length}
          </div>
        )}
      </div>
      
      <div style={{
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        padding: '12px',
        backgroundColor: 'var(--intel-bg-primary)',
        border: '1px solid var(--intel-border)',
        borderRadius: '4px',
        fontSize: '0.85rem',
        lineHeight: '1.5'
      }}>
        {isMarkdown ? (
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ 
              __html: intelMarkdownRenderer.parseMarkdown(typeof content === 'string' ? content : '').htmlContent
            }}
          />
        ) : (
          <pre style={{ 
            margin: 0, 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}>
            {typeof content === 'string' ? content : 'Binary content'}
          </pre>
        )}
      </div>
    </div>
  );
};

// Metadata Panel - Shows file properties and metadata
interface MetadataPanelProps {
  file: VirtualFile | null;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ file }) => {
  if (!file) {
    return (
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          color: 'var(--intel-text)',
          fontSize: '1.1rem'
        }}>Properties</h3>
        <p style={{ 
          color: 'var(--intel-text-dim)',
          fontSize: '0.9rem'
        }}>Select a file to view metadata</p>
      </div>
    );
  }

  const getValidClassification = (frontmatter: Record<string, unknown> | undefined): string => {
    const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    if (frontmatter && typeof frontmatter.classification === 'string' && 
        validClassifications.includes(frontmatter.classification)) {
      return frontmatter.classification;
    }
    return 'UNCLASSIFIED';
  };

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        color: 'var(--intel-text)',
        fontSize: '1.1rem'
      }}>Properties</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          margin: '0 0 8px 0',
          color: 'var(--intel-text)',
          fontSize: '0.95rem'
        }}>File Information</h4>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Name:</label>
          <span style={{ color: 'var(--intel-text)' }}>{file.name}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Path:</label>
          <span style={{ color: 'var(--intel-text)' }}>{file.path}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Size:</label>
          <span style={{ color: 'var(--intel-text)' }}>{file.size} bytes</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.85rem'
        }}>
          <label style={{ color: 'var(--intel-text-dim)' }}>Type:</label>
          <span style={{ color: 'var(--intel-text)' }}>{file.mimeType || 'unknown'}</span>
        </div>
      </div>

      {file.frontmatter && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            margin: '0 0 8px 0',
            color: 'var(--intel-text)',
            fontSize: '0.95rem'
          }}>Metadata</h4>
          
          {file.frontmatter.classification && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '0.85rem'
            }}>
              <label style={{ color: 'var(--intel-text-dim)' }}>Classification:</label>
              <span className={`classification ${getValidClassification(file.frontmatter).toLowerCase()}`}>
                {getValidClassification(file.frontmatter)}
              </span>
            </div>
          )}
          
          {file.frontmatter.category && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '0.85rem'
            }}>
              <label style={{ color: 'var(--intel-text-dim)' }}>Category:</label>
              <span style={{ color: 'var(--intel-text)' }}>{file.frontmatter.category as string}</span>
            </div>
          )}
          
          {file.frontmatter.wikilinks && Array.isArray(file.frontmatter.wikilinks) && (
            <div style={{ marginBottom: '8px' }}>
              <label style={{ 
                color: 'var(--intel-text-dim)',
                fontSize: '0.85rem',
                display: 'block',
                marginBottom: '4px'
              }}>Wikilinks ({(file.frontmatter.wikilinks as string[]).length}):</label>
              <div style={{ 
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '0.8rem'
              }}>
                {(file.frontmatter.wikilinks as string[]).map((link, index) => (
                  <div key={index} style={{ 
                    color: 'var(--intel-text)',
                    marginBottom: '2px',
                    padding: '2px 4px',
                    backgroundColor: 'var(--intel-bg-secondary)',
                    borderRadius: '2px'
                  }}>
                    [[{link}]]
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {file.relationships && file.relationships.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            margin: '0 0 8px 0',
            color: 'var(--intel-text)',
            fontSize: '0.95rem'
          }}>Relationships</h4>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '0.85rem'
          }}>
            <label style={{ color: 'var(--intel-text-dim)' }}>Outgoing links:</label>
            <span style={{ color: 'var(--intel-text)' }}>{file.relationships.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
