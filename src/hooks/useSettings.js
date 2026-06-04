import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../lib/storage.js';

/**
 * Settings state synced to localStorage. Also applies theme / accessibility
 * preferences to the document root as a side effect.
 */
export function useSettings() {
  const [settings, setSettings] = useState(() => loadSettings());

  // Apply visual preferences whenever they change.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
    root.classList.toggle('contrast-high', Boolean(settings.highContrast));
    root.style.setProperty('--app-font-scale', String(settings.fontScale || 1));
  }, [settings.theme, settings.highContrast, settings.fontScale]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, reset };
}
