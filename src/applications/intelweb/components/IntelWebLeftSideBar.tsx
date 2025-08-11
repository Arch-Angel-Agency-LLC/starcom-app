/**
 * IntelWeb Left Sidebar Component
 * Shows the file explorer/vault browser
 */

import React, { useState } from 'react';
import { VirtualFileSystem, VirtualFile } from '../../../types/DataPack';

// Tree structure for file explorer
interface TreeNode {
  [key: string]: VirtualFile | TreeNode;
}

// Type guard
const isVirtualFile = (value: VirtualFile | TreeNode): value is VirtualFile => {
  return (value as VirtualFile).path !== undefined;
};

interface IntelWebLeftSideBarProps {
  vault: VirtualFileSystem;
  selectedFile: VirtualFile | null;
  onFileSelect: (file: VirtualFile) => void;
}

export const IntelWebLeftSideBar: React.FC<IntelWebLeftSideBarProps> = ({
  vault,
  selectedFile,
  onFileSelect
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build file tree structure
  const buildFileTree = () => {
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
    <div className="intel-web-left-sidebar">
      <div className="vault-header">
        <h3>Demo Intelligence Vault</h3>
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
