import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Maximize2, Minimize2, X, Move, Lock, Unlock } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from './OSINTPanelLayout.module.css';

// Import panel components
import SearchPanel from './panels/SearchPanel';
import ResultsPanel from './panels/ResultsPanel';
import GraphPanel from './panels/GraphPanel';
import TimelinePanel from './panels/TimelinePanel';
import MapPanel from './panels/MapPanel';
import BlockchainPanel from './panels/BlockchainPanel';
import DarkWebPanel from './panels/DarkWebPanel';
import OPSECPanel from './panels/OPSECPanel';

// Import types
import { Panel, PanelType } from '../types/osint';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface OSINTPanelLayoutProps {
  panels: Panel[];
  onLayoutChange?: (panels: Panel[]) => void;
  className?: string;
}

// Map of panel types to components
const panelComponents: Record<PanelType, React.ComponentType<any>> = {
  search: SearchPanel,
  results: ResultsPanel,
  graph: GraphPanel,
  timeline: TimelinePanel,
  map: MapPanel,
  blockchain: BlockchainPanel,
  darkweb: DarkWebPanel,
  opsec: OPSECPanel,
  console: () => <div>Console Panel</div>,
  notes: () => <div>Notes Panel</div>
};

// Map of panel types to titles
const panelTitles: Record<PanelType, string> = {
  search: 'Search Configuration',
  results: 'Search Results',
  graph: 'Entity Relationship Graph',
  timeline: 'Timeline Analysis',
  map: 'Geospatial Intelligence',
  blockchain: 'Blockchain Analysis',
  darkweb: 'Dark Web Monitor',
  opsec: 'OPSEC Shield',
  console: 'Command Console',
  notes: 'Investigation Notes'
};

/**
 * Flexible panel layout system for OSINT dashboard
 * Allows for drag-and-drop arrangement of investigation panels
 */
export const OSINTPanelLayout: React.FC<OSINTPanelLayoutProps> = ({
  panels,
  onLayoutChange,
  className = ''
}) => {
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  
  // Convert panels to grid layout format
  const getLayoutConfig = () => {
    return panels.map(panel => ({
      ...panel.position,
      i: panel.id,
      isDraggable: !panel.locked && !maximizedPanel,
      isResizable: !panel.locked && !maximizedPanel,
      static: panel.locked || Boolean(maximizedPanel)
    }));
  };
  
  // Handle layout changes from react-grid-layout
  const handleLayoutChange = (layout: any) => {
    if (!onLayoutChange) return;
    
    // Update panel positions based on new layout
    const updatedPanels = panels.map(panel => {
      const layoutItem = layout.find((item: any) => item.i === panel.id);
      if (!layoutItem) return panel;
      
      return {
        ...panel,
        position: {
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      };
    });
    
    onLayoutChange(updatedPanels);
  };
  
  // Handle panel removal
  const handleRemovePanel = (panelId: string) => {
    if (!onLayoutChange) return;
    
    const updatedPanels = panels.filter(panel => panel.id !== panelId);
    onLayoutChange(updatedPanels);
  };
  
  // Toggle panel maximized state
  const handleToggleMaximize = (panelId: string) => {
    if (maximizedPanel === panelId) {
      setMaximizedPanel(null);
    } else {
      setMaximizedPanel(panelId);
    }
  };
  
  // Toggle panel lock
  const handleToggleLock = (panelId: string) => {
    if (!onLayoutChange) return;
    
    const updatedPanels = panels.map(panel => 
      panel.id === panelId ? { ...panel, locked: !panel.locked } : panel
    );
    
    onLayoutChange(updatedPanels);
  };
  
  // Determine layout based on maximized state
  const getGridLayout = () => {
    if (maximizedPanel) {
      // If a panel is maximized, show only that panel
      return {
        lg: panels.map(panel => ({
          ...panel.position,
          i: panel.id,
          x: panel.id === maximizedPanel ? 0 : 0,
          y: panel.id === maximizedPanel ? 0 : 0,
          w: panel.id === maximizedPanel ? 12 : 0,
          h: panel.id === maximizedPanel ? 12 : 0,
          isDraggable: false,
          isResizable: false,
          static: true
        }))
      };
    }
    
    // Normal layout
    return {
      lg: getLayoutConfig(),
      md: getLayoutConfig(),
      sm: getLayoutConfig(),
      xs: getLayoutConfig(),
      xxs: getLayoutConfig()
    };
  };

  return (
    <div className={`${styles.panelLayoutContainer} ${className}`}>
      <ResponsiveGridLayout
        className={styles.layout}
        layouts={getGridLayout()}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[10, 10]}
        containerPadding={[10, 10]}
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        draggableHandle=".panel-drag-handle"
      >
        {panels.map(panel => {
          const PanelComponent = panelComponents[panel.type];
          const panelTitle = panelTitles[panel.type];
          const isMaximized = maximizedPanel === panel.id;
          const isHidden = maximizedPanel !== null && !isMaximized;
          
          return (
            <div 
              key={panel.id} 
              className={`${styles.panel} ${isMaximized ? styles.maximized : ''} ${isHidden ? styles.hidden : ''} ${panel.locked ? styles.locked : ''}`}
              data-panel-type={panel.type}
            >
              <div className={`${styles.panelHeader} panel-drag-handle`}>
                <div className={styles.panelHeaderLeft}>
                  <Move className={styles.dragHandle} size={16} />
                  <h3 className={styles.panelTitle}>{panelTitle}</h3>
                </div>
                <div className={styles.panelControls}>
                  <button 
                    className={styles.panelControl}
                    onClick={() => handleToggleLock(panel.id)}
                    aria-label={panel.locked ? "Unlock panel" : "Lock panel"}
                  >
                    {panel.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button 
                    className={styles.panelControl}
                    onClick={() => handleToggleMaximize(panel.id)}
                    aria-label={isMaximized ? "Restore panel" : "Maximize panel"}
                  >
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button 
                    className={styles.panelControl}
                    onClick={() => handleRemovePanel(panel.id)}
                    aria-label="Close panel"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className={styles.panelContent}>
                <PanelComponent data={panel.data} panelId={panel.id} />
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default OSINTPanelLayout;
