// State management for TopBar preferences (artifact-driven)
import { useState, useEffect } from 'react';
import { TOPBAR_CATEGORIES } from './topbarCategories';

export interface TopBarPreferences {
  enabledCategories: Record<string, boolean>;
  version: number;
}

const PREFERENCES_VERSION = 1;
const STORAGE_KEY = 'topbar-preferences';

function getDefaultPreferences(): TopBarPreferences {
  const enabledCategories: Record<string, boolean> = {};
  TOPBAR_CATEGORIES.forEach(cat => {
    enabledCategories[cat.id] = cat.defaultEnabled;
  });
  return { enabledCategories, version: PREFERENCES_VERSION };
}

export function loadPreferences(): TopBarPreferences {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultPreferences();
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== PREFERENCES_VERSION) {
      // TODO: handle migration/versioning
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
