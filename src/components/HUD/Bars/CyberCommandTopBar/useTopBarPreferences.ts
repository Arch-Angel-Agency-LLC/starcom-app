// State management for TopBar preferences (artifact-driven)
import { useState, useEffect } from 'react';
import { TOPBAR_CATEGORIES } from './topbarCategories';

export interface TopBarPreferences {
  enabledCategories: Record<string, boolean>;
  version: number;
}

const PREFERENCES_VERSION = 3; // Bumped to force complete migration to energy-only categories
const STORAGE_KEY = 'topbar-preferences';

function getDefaultPreferences(): TopBarPreferences {
  const enabledCategories: Record<string, boolean> = {};
  TOPBAR_CATEGORIES.forEach(cat => {
    enabledCategories[cat.id] = cat.defaultEnabled;
  });
  return { enabledCategories, version: PREFERENCES_VERSION };
}

// Force refresh preferences if categories have changed significantly
function shouldResetPreferences(currentPrefs: TopBarPreferences): boolean {
  const currentEnabled = Object.keys(currentPrefs.enabledCategories).filter(id => currentPrefs.enabledCategories[id]);
  const newDefaultEnabled = TOPBAR_CATEGORIES.filter(cat => cat.defaultEnabled).map(cat => cat.id);
  
  // Debug: Log preference comparison
  console.debug('Preference comparison:', { currentEnabled, newDefaultEnabled });
  
  // Reset if user has old financial-heavy preferences but no energy categories
  const hasEnergyCategories = currentEnabled.some(id => ['commodities', 'energy-security', 'power-grid', 'market-intelligence'].includes(id));
  const hasOldFinancialCategories = currentEnabled.some(id => ['indices', 'crypto', 'economic', 'news', 'sentiment'].includes(id));
  
  return !hasEnergyCategories && hasOldFinancialCategories;
}

export function loadPreferences(): TopBarPreferences {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultPreferences();
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== PREFERENCES_VERSION) {
      // Force reset to new energy-focused categories
      console.log('TopBar preferences version mismatch - resetting to energy categories');
      return getDefaultPreferences();
    }
    // Also reset if old financial categories are enabled
    if (shouldResetPreferences(parsed)) {
      console.log('TopBar preferences contain old financial categories - resetting to energy categories');
      return getDefaultPreferences();
    }
    return parsed;
  } catch {
    return getDefaultPreferences();
  }
}

export function useTopBarPreferences() {
  const [preferences, setPreferences] = useState<TopBarPreferences>(loadPreferences());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setCategoryEnabled = (id: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      enabledCategories: { ...prev.enabledCategories, [id]: enabled },
    }));
  };

  return {
    preferences,
    setCategoryEnabled,
    setPreferences,
  };
}
// AI-NOTE: Handles loading, saving, and updating user preferences for TopBar categories.
