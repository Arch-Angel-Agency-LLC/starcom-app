// AI-NOTE: Utility functions to ensure UI state reflects persistent settings
// Helps guarantee consistency between stored settings and UI display

import React, { useEffect, useState } from 'react';

/**
 * Hook to ensure form control values reflect the actual persistent state
 * Useful for components that need to sync with external state changes
 */
export const useSettingsReflection = <T>(persistentValue: T, onChange: (value: T) => void) => {
  const [uiValue, setUiValue] = useState<T>(persistentValue);

  // Sync UI value with persistent value when it changes
  useEffect(() => {
    setUiValue(persistentValue);
  }, [persistentValue]);

  // Handle UI changes and propagate to persistent storage
  const handleUIChange = (newValue: T) => {
    setUiValue(newValue);
    onChange(newValue);
  };

  return {
    value: uiValue,
    onChange: handleUIChange,
    isInSync: uiValue === persistentValue
  };
};

/**
 * Hook to force UI re-render when settings change
 * Useful for components that need to reflect external setting changes
 */
export const useSettingsSync = (dependencies: React.DependencyList) => {
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    setSyncKey(prev => prev + 1);
  }, dependencies);

  return syncKey;
};

/**
 * Hook to validate that UI controls are showing the correct persistent values
 * Useful for debugging and ensuring UI consistency
 */
export const useSettingsValidation = <T extends Record<string, unknown>>(
  componentName: string,
  persistentSettings: T,
  uiSettings: Partial<T>
) => {
  useEffect(() => {
    const mismatches: string[] = [];
    
    Object.entries(uiSettings).forEach(([key, uiValue]) => {
      const persistentValue = persistentSettings[key];
      if (persistentValue !== uiValue) {
        mismatches.push(`${key}: UI=${JSON.stringify(uiValue)} ≠ Persistent=${JSON.stringify(persistentValue)}`);
      }
    });

    if (mismatches.length > 0) {
      console.warn(`⚠️ ${componentName} UI/Persistent mismatch:`, mismatches);
    } else {
      // Only log in dev mode to reduce console noise
      if (import.meta.env.DEV) {
        console.log(`✅ ${componentName} UI state in sync with persistent settings`);
      }
    }
  }, [componentName, persistentSettings, uiSettings]);
};

/**
 * Utility to create controlled input props that reflect persistent state
 */
export const createControlledInputProps = <T>(
  value: T,
  onChange: (value: T) => void,
  transform?: {
    toUI?: (value: T) => string | number | boolean;
    fromUI?: (uiValue: string | number | boolean) => T;
  }
) => {
  const toUI = transform?.toUI || ((v: T) => v as string | number | boolean);
  const fromUI = transform?.fromUI || ((v: string | number | boolean) => v as T);

  return {
    value: toUI(value),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = e.target;
      let uiValue: string | number | boolean;
      
      if (target.type === 'checkbox') {
        uiValue = (target as HTMLInputElement).checked;
      } else if (target.type === 'number' || target.type === 'range') {
        uiValue = parseFloat(target.value) || 0;
      } else {
        uiValue = target.value;
      }
      
      onChange(fromUI(uiValue));
    }
  };
};

/**
 * Debug utility to log all persistent settings to console
 */
export const debugPersistentSettings = (label: string, settings: Record<string, unknown>) => {
  console.group(`🔍 ${label} - Persistent Settings Debug`);
  Object.entries(settings).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();
};

export default {
  useSettingsReflection,
  useSettingsSync,
  useSettingsValidation,
  createControlledInputProps,
  debugPersistentSettings
};
