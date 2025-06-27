// EnhancedSettingsPopup.tsx
// Artifact-driven: enhanced modal for toggling TopBar data categories with unified settings integration
import React, { useRef, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { TopBarCategory } from './topbarCategories';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';

export interface EnhancedSettingsPopupProps {
  open: boolean;
  enabledCategories: Record<string, boolean>;
  onCategoryToggle: (id: string, enabled: boolean) => void;
  onClose: () => void;
  categories: TopBarCategory[];
}

const EnhancedSettingsPopup: React.FC<EnhancedSettingsPopupProps> = ({
  open,
  enabledCategories,
  onCategoryToggle,
  onClose,
  categories,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { config, updateSpaceWeather } = useEcoNaturalSettings();

  // Close on ESC or outside click
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enhanced-settings-modal-title"
        aria-describedby="enhanced-settings-modal-desc"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        style={{ backdropFilter: 'blur(2px)' }}
      >
        <div
          ref={modalRef}
          className="bg-gray-900 rounded-lg shadow-lg p-6 w-80 max-h-[80vh] overflow-y-auto outline-none"
        >
          <h2 id="enhanced-settings-modal-title" className="text-lg font-bold mb-4 text-cyan-300 flex items-center">
            <span role="img" aria-label="Settings">⚙️</span> <span className="ml-2">Enhanced Settings</span>
          </h2>
          <p id="enhanced-settings-modal-desc" className="text-gray-400 mb-4 text-sm">
            Toggle which data categories are visible in the TopBar and configure space weather settings.
          </p>
          
          {/* TopBar Categories */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-cyan-200">Data Categories</h3>
            <form>
              <ul className="space-y-2">
                {categories.map((cat: TopBarCategory) => (
                  <li key={cat.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cat-${cat.id}`}
                      checked={!!enabledCategories[cat.id]}
                      onChange={e => onCategoryToggle(cat.id, e.target.checked)}
                      aria-checked={!!enabledCategories[cat.id]}
                      aria-labelledby={`label-${cat.id}`}
                      className="mr-2 accent-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                    <label
                      id={`label-${cat.id}`}
                      htmlFor={`cat-${cat.id}`}
                      className="flex items-center cursor-pointer select-none"
                    >
                      <span className="mr-2" aria-hidden="true">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </form>
          </div>

          {/* Space Weather Settings */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-md font-semibold mb-3 text-cyan-200">Space Weather Visualization</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="electric-fields-toggle"
                  checked={config.spaceWeather.showElectricFields}
                  onChange={(e) => updateSpaceWeather({ showElectricFields: e.target.checked })}
                  aria-checked={config.spaceWeather.showElectricFields}
                  aria-labelledby="electric-fields-label"
                  className="mr-2 accent-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
                <label
                  id="electric-fields-label"
                  htmlFor="electric-fields-toggle"
                  className="flex items-center cursor-pointer select-none"
                >
                  <span className="mr-2" aria-hidden="true">⚡</span>
                  <span>Show Electric Fields</span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="magnetic-field-toggle"
                  checked={config.spaceWeather.showMagneticField}
                  onChange={(e) => updateSpaceWeather({ showMagneticField: e.target.checked })}
                  aria-checked={config.spaceWeather.showMagneticField}
                  aria-labelledby="magnetic-field-label"
                  className="mr-2 accent-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
                <label
                  id="magnetic-field-label"
                  htmlFor="magnetic-field-toggle"
                  className="flex items-center cursor-pointer select-none"
                >
                  <span className="mr-2" aria-hidden="true">🧲</span>
                  <span>Show Magnetic Field</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default EnhancedSettingsPopup;

// AI-NOTE: Enhanced modal integrates TopBar categories with unified space weather settings.
// Uses useEcoNaturalSettings hook for consistent state management across components.
