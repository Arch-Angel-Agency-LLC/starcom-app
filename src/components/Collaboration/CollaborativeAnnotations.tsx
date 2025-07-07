/**
 * Collaborative Annotation System
 * 
 * Real-time collaborative annotations for multi-agency intelligence analysis.
 * Supports globe, timeline, and node graph views with secure multi-agency access.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useCollaborationFeatures } from '../../hooks/useUnifiedGlobalCommand';
import type { 
  CollaborativeAnnotation, 
  AnnotationPosition,
  AgencyType,
  ClearanceLevel 
} from '../../types';
import styles from './CollaborativeAnnotations.module.css';

// ============================================================================
// ANNOTATION DISPLAY COMPONENT
// ============================================================================

interface AnnotationDisplayProps {
  annotations: CollaborativeAnnotation[];
  viewType: 'GLOBE' | 'TIMELINE' | 'NODE_GRAPH';
  onAnnotationClick?: (annotation: CollaborativeAnnotation) => void;
  onAnnotationReply?: (annotationId: string, content: string) => void;
}

// TODO: Implement investigation backup and recovery mechanisms - PRIORITY: MEDIUM
export const AnnotationDisplay: React.FC<AnnotationDisplayProps> = ({
  annotations,
  viewType,
  onAnnotationClick,
  onAnnotationReply
}) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const filteredAnnotations = useMemo(() => {
    return annotations.filter(annotation => 
      annotation.position.viewType === viewType
    );
  }, [annotations, viewType]);

  const handleAnnotationClick = useCallback((annotation: CollaborativeAnnotation) => {
    setSelectedAnnotation(annotation.id);
    onAnnotationClick?.(annotation);
  }, [onAnnotationClick]);

  const handleReplySubmit = useCallback((annotationId: string) => {
    if (replyContent.trim()) {
      onAnnotationReply?.(annotationId, replyContent);
      setReplyContent('');
      setSelectedAnnotation(null);
    }
  }, [replyContent, onAnnotationReply]);

  const getAnnotationIcon = (type: CollaborativeAnnotation['type']) => {
    switch (type) {
      case 'NOTE': return '📝';
      case 'MARKER': return '📍';
      case 'HIGHLIGHT': return '✨';
      case 'LINK': return '🔗';
      case 'WARNING': return '⚠️';
      default: return '💬';
    }
  };

  const getAgencyColor = (agency: AgencyType) => {
    switch (agency) {
      case 'SOCOM': return '#2E7D32';
      case 'SPACE_FORCE': return '#1565C0';
      case 'CYBER_COMMAND': return '#7B1FA2';
      case 'NSA': return '#E65100';
      case 'DIA': return '#C62828';
      case 'CIA': return '#424242';
      default: return '#616161';
    }
  };

  const getClearanceColor = (classification: ClearanceLevel) => {
    switch (classification) {
      case 'UNCLASSIFIED': return '#4CAF50';
      case 'CONFIDENTIAL': return '#FF9800';
      case 'SECRET': return '#F44336';
      case 'TOP_SECRET': return '#9C27B0';
      case 'SCI': return '#000000';
      default: return '#757575';
    }
  };

  return (
    <div className={styles.annotationContainer}>
      {filteredAnnotations.map(annotation => (
        <div
          key={annotation.id}
          className={`${styles.annotation} ${
            selectedAnnotation === annotation.id ? styles.selected : ''
          }`}
          onClick={() => handleAnnotationClick(annotation)}
          style={{
            '--agency-color': getAgencyColor(annotation.agency),
            '--classification-color': getClearanceColor(annotation.classification)
          } as React.CSSProperties}
        >
          <div className={styles.annotationHeader}>
            <div className={styles.annotationIcon}>
              {getAnnotationIcon(annotation.type)}
            </div>
            <div className={styles.annotationMeta}>
              <span className={styles.authorName}>{annotation.authorName}</span>
              <span className={styles.agency}>{annotation.agency}</span>
              <span className={styles.timestamp}>
                {annotation.createdAt.toLocaleTimeString()}
              </span>
            </div>
            <div className={styles.classification}>
              {annotation.classification}
            </div>
          </div>

          <div className={styles.annotationContent}>
            {annotation.content}
          </div>

          {annotation.linkedAssets && annotation.linkedAssets.length > 0 && (
            <div className={styles.linkedAssets}>
              <span className={styles.linkedLabel}>Linked Assets:</span>
              {annotation.linkedAssets.map(assetId => (
                <span key={assetId} className={styles.linkedAsset}>
                  {assetId}
                </span>
              ))}
            </div>
          )}

          {annotation.responses && annotation.responses.length > 0 && (
            <div className={styles.responses}>
              <div className={styles.responseCount}>
                {annotation.responses.length} response(s)
              </div>
              {annotation.responses.slice(0, 2).map(response => (
                <div key={response.id} className={styles.response}>
                  <span className={styles.responseAuthor}>{response.authorName}:</span>
                  <span className={styles.responseContent}>{response.content}</span>
                </div>
              ))}
            </div>
          )}

          {selectedAnnotation === annotation.id && (
            <div className={styles.replyBox}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Add a reply..."
                className={styles.replyInput}
                rows={2}
              />
              <div className={styles.replyActions}>
                <button
                  onClick={() => handleReplySubmit(annotation.id)}
                  className={styles.replySubmit}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </button>
                <button
                  onClick={() => setSelectedAnnotation(null)}
                  className={styles.replyCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// ANNOTATION CREATION COMPONENT
// ============================================================================

interface AnnotationCreatorProps {
  viewType: 'GLOBE' | 'TIMELINE' | 'NODE_GRAPH';
  position: AnnotationPosition;
  onAnnotationCreate: (annotation: Omit<CollaborativeAnnotation, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const AnnotationCreator: React.FC<AnnotationCreatorProps> = ({
  viewType,
  position,
  onAnnotationCreate,
  onCancel
}) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<CollaborativeAnnotation['type']>('NOTE');
  const [classification, setClassification] = useState<ClearanceLevel>('SECRET');
  
  const collaborationFeatures = useCollaborationFeatures();
  const hasCollaboration = collaborationFeatures?.hasCollaboration;
  
  // TODO: Replace with actual operator from collaboration state
  const operator = useMemo(() => ({ 
    id: 'temp-operator', 
    name: 'Unknown Operator',
    agency: 'UNKNOWN' as AgencyType
  }), []);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || !operator) return;

    const annotation: Omit<CollaborativeAnnotation, 'id' | 'createdAt'> = {
      authorId: operator.id,
      authorName: operator.name,
      agency: operator.agency,
      content: content.trim(),
      position,
      type,
      classification,
      responses: []
    };

    onAnnotationCreate(annotation);
    setContent('');
    setType('NOTE');
  }, [content, operator, position, type, classification, onAnnotationCreate]);

  // TODO: Implement full collaboration features
  if (!hasCollaboration) {
    return (
      <div className={styles.noCollaboration}>
        <p>Collaboration features not available</p>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className={styles.annotationCreator}>
        <div className={styles.errorMessage}>
          No operator profile set. Cannot create annotations.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.annotationCreator}>
      <div className={styles.creatorHeader}>
        <h4>Create Annotation</h4>
        <div className={styles.positionInfo}>
          {viewType} - {position.coordinates && (
            <>
              {viewType === 'GLOBE' && position.coordinates.lat !== undefined && (
                `${position.coordinates.lat.toFixed(3)}, ${position.coordinates.lng?.toFixed(3)}`
              )}
              {viewType === 'TIMELINE' && position.coordinates.timestamp && (
                position.coordinates.timestamp.toLocaleString()
              )}
              {viewType === 'NODE_GRAPH' && position.coordinates.x !== undefined && (
                `(${position.coordinates.x}, ${position.coordinates.y})`
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.creatorForm}>
        <div className={styles.formRow}>
          <label htmlFor="annotation-type">Type:</label>
          <select
            id="annotation-type"
            value={type}
            onChange={(e) => setType(e.target.value as CollaborativeAnnotation['type'])}
            className={styles.typeSelect}
          >
            <option value="NOTE">Note</option>
            <option value="MARKER">Marker</option>
            <option value="HIGHLIGHT">Highlight</option>
            <option value="LINK">Link</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>

        <div className={styles.formRow}>
          <label htmlFor="annotation-classification">Classification:</label>
          <select
            id="annotation-classification"
            value={classification}
            onChange={(e) => setClassification(e.target.value as ClearanceLevel)}
            className={styles.classificationSelect}
          >
            <option value="UNCLASSIFIED">Unclassified</option>
            <option value="CONFIDENTIAL">Confidential</option>
            <option value="SECRET">Secret</option>
            <option value="TOP_SECRET">Top Secret</option>
            <option value="SCI">SCI</option>
          </select>
        </div>

        <div className={styles.formRow}>
          <label htmlFor="annotation-content">Content:</label>
          <textarea
            id="annotation-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter annotation content..."
            className={styles.contentInput}
            rows={4}
          />
        </div>

        <div className={styles.formActions}>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={styles.submitButton}
          >
            Create Annotation
          </button>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ANNOTATION MANAGER COMPONENT
// ============================================================================

interface AnnotationManagerProps {
  viewType: 'GLOBE' | 'TIMELINE' | 'NODE_GRAPH';
  annotations: CollaborativeAnnotation[];
  onCreatePosition?: AnnotationPosition | null;
  onAnnotationCreate?: () => void;
}

export const AnnotationManager: React.FC<AnnotationManagerProps> = ({
  viewType,
  annotations,
  onCreatePosition,
  onAnnotationCreate
}) => {
  const [showCreator, setShowCreator] = useState(false);

  const handleAnnotationCreate = useCallback((annotation: Omit<CollaborativeAnnotation, 'id' | 'createdAt'>) => {
    // TODO: Implement addAnnotation function
    console.log('Creating annotation:', annotation);
    setShowCreator(false);
    onAnnotationCreate?.();
  }, [onAnnotationCreate]);

  const handleAnnotationReply = useCallback((annotationId: string, content: string) => {
    // TODO: Implement annotation reply functionality
    console.log('Reply to annotation:', annotationId, content);
  }, []);

  // Show creator when onCreatePosition is provided
  const shouldShowCreator = showCreator || onCreatePosition !== null;
  const creatorPosition = onCreatePosition || {
    viewType,
    coordinates: { x: 0, y: 0 }
  };

  return (
    <div className={styles.annotationManager}>
      <div className={styles.annotationHeader}>
        <h3>Collaborative Annotations</h3>
        <div className={styles.annotationStats}>
          <span className={styles.annotationCount}>
            {annotations.filter(a => a.position.viewType === viewType).length} annotations
          </span>
          <button
            onClick={() => setShowCreator(true)}
            className={styles.createButton}
            disabled={shouldShowCreator}
          >
            + Add Annotation
          </button>
        </div>
      </div>

      {shouldShowCreator && (
        <div className={styles.creatorOverlay}>
          <AnnotationCreator
            viewType={viewType}
            position={creatorPosition}
            onAnnotationCreate={handleAnnotationCreate}
            onCancel={() => {
              setShowCreator(false);
              onAnnotationCreate?.();
            }}
          />
        </div>
      )}

      <AnnotationDisplay
        annotations={annotations}
        viewType={viewType}
        onAnnotationReply={handleAnnotationReply}
      />
    </div>
  );
};

export default AnnotationManager;
