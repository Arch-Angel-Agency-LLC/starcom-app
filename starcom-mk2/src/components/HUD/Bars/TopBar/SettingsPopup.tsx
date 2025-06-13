// SettingsPopup.tsx
// Artifact-driven: modal for toggling TopBar data categories
import React, { useRef, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { SettingsPopupProps } from '../../../../artifacts/topbar-component-api.artifact'; // AI-NOTE: Replace with local type if needed
import { TopBarCategory } from './topbarCategories';

const SettingsPopup: React.FC<SettingsPopupProps> = ({
  open,
  enabledCategories,
  onCategoryToggle,
  onClose,
  categories,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-desc"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        style={{ backdropFilter: 'blur(2px)' }}
      >
        <div
          ref={modalRef}
          className="bg-gray-900 rounded-lg shadow-lg p-6 w-80 max-h-[80vh] overflow-y-auto outline-none"
        >
          <h2 id="settings-modal-title" className="text-lg font-bold mb-4 text-cyan-300 flex items-center">
            <span role="img" aria-label="Settings">⚙️</span> <span className="ml-2">Settings</span>
          </h2>
          <p id="settings-modal-desc" className="text-gray-400 mb-4 text-sm">
            Toggle which data categories are visible in the TopBar.
          </p>
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
      </div>
    </FocusTrap>
  );
};

export default SettingsPopup;
// AI-NOTE: Modal is accessible, focus-trapped, ESC/outside-click dismiss, and scrollable for long lists.
