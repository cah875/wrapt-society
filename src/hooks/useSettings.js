import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings, extractSheetId, DEFAULT_SETTINGS } from '../lib/storage.js';

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
      // Keep sheetId derived from the URL automatically.
      if (patch.sheetUrl !== undefined) {
        next.sheetId = extractSheetId(patch.sheetUrl);
      }
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Configuration completeness — drives the first-run setup wizard.
  const visionReady = Boolean(settings.anthropicApiKey) || true; // server env var may cover it
  const sheetsConfigured = Boolean(settings.sheetId);

  return { settings, update, reset, visionReady, sheetsConfigured };
}
