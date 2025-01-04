import React from 'react';

interface LegendItem {
  label: string;
  color: string;
  size?: number; // Optional, for marker size representation
}

interface LegendProps {
  items: LegendItem[];
  title?: string; // Optional, for legend section titles
  maxSize?: number; // Optional, for scaling marker sizes
  collapsible?: boolean; // Optional, for collapsibility
}

const Legend: React.FC<LegendProps> = ({ items, title, maxSize = 2, collapsible = false }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 1000,
        maxWidth: '200px',
        cursor: 'pointer',
      }}
    >
      {title && (
        <h4 style={{ margin: '0 0 10px', fontSize: '16px' }}>
          {title}
          {collapsible && (
            <button
              onClick={handleToggle}
              style={{
                marginLeft: '10px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
              aria-label={isCollapsed ? 'Expand Legend' : 'Collapse Legend'}
            >
              {isCollapsed ? '+' : '-'}
            </button>
          )}
        </h4>
      )}
      {!isCollapsed && (
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {items.length === 0 ? (
            <li>No data to display</li>
          ) : (
            items.map((item, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: `${(item.size || 1) / maxSize * 20}px`,
                    height: '20px',
                    backgroundColor: item.color,
                    borderRadius: '50%',
                    marginRight: '10px',
                  }}
                ></span>
                <span>{item.label}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default Legend;