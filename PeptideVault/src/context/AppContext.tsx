// Global app state: profiles, active profile, and the active profile's
// inventory. Backed by AsyncStorage via storageUtils. Also runs the
// AppState foreground expiry check + notification refresh.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Profile, VialRecord } from '../types';
import {
  MAX_PROFILES,
  addVialRecord,
  deleteProfile,
  deleteVialRecord,
  generateId,
  getActiveProfileId,
  getInventory,
  getProfiles,
  saveProfiles,
  setActiveProfileId,
  updateVialRecord,
} from '../utils/storageUtils';
import { refreshExpiryNotifications } from '../utils/notificationUtils';

interface AppContextValue {
  loading: boolean;
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  inventory: VialRecord[];
  reloadInventory: () => Promise<void>;
  createProfile: (name: string) => Promise<Profile | null>;
  renameProfile: (id: string, name: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  addVial: (vial: VialRecord) => Promise<void>;
  updateVial: (vial: VialRecord) => Promise<void>;
  removeVial: (vialId: string) => Promise<void>;
  canAddProfile: boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<VialRecord[]>([]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const loadInventoryFor = useCallback(async (profileId: string | null) => {
    if (!profileId) {
      setInventory([]);
      return;
    }
    const inv = await getInventory(profileId);
    setInventory(inv);
    refreshExpiryNotifications(inv);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const [allProfiles, active] = await Promise.all([
      getProfiles(),
      getActiveProfileId(),
    ]);
    setProfiles(allProfiles);
    const resolvedActive =
      active && allProfiles.some((p) => p.id === active)
        ? active
        : allProfiles[0]?.id ?? null;
    setActiveId(resolvedActive);
    await loadInventoryFor(resolvedActive);
    setLoading(false);
  }, [loadInventoryFor]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Foreground expiry check: re-read inventory and refresh notifications.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active' && activeId) {
        loadInventoryFor(activeId);
      }
    });
    return () => sub.remove();
  }, [activeId, loadInventoryFor]);

  const reloadInventory = useCallback(
    () => loadInventoryFor(activeId),
    [activeId, loadInventoryFor],
  );

  const createProfile = useCallback(
    async (name: string): Promise<Profile | null> => {
      const current = await getProfiles();
      if (current.length >= MAX_PROFILES) return null;
      const profile: Profile = {
        id: generateId(),
        name: name.trim() || 'New Profile',
        createdAt: new Date().toISOString(),
      };
      const next = [...current, profile];
      await saveProfiles(next);
      await setActiveProfileId(profile.id);
      setProfiles(next);
      setActiveId(profile.id);
      await loadInventoryFor(profile.id);
      return profile;
    },
    [loadInventoryFor],
  );

  const renameProfile = useCallback(async (id: string, name: string) => {
    const current = await getProfiles();
    const next = current.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name } : p,
    );
    await saveProfiles(next);
    setProfiles(next);
  }, []);

  const switchProfile = useCallback(
    async (id: string) => {
      await setActiveProfileId(id);
      setActiveId(id);
      await loadInventoryFor(id);
    },
    [loadInventoryFor],
  );

  const removeProfile = useCallback(
    async (id: string) => {
      const next = await deleteProfile(id);
      setProfiles(next);
      if (id === activeId) {
        const newActive = next[0]?.id ?? null;
        if (newActive) await setActiveProfileId(newActive);
        setActiveId(newActive);
        await loadInventoryFor(newActive);
      }
    },
    [activeId, loadInventoryFor],
  );

  const addVial = useCallback(
    async (vial: VialRecord) => {
      if (!activeId) return;
      const next = await addVialRecord(activeId, vial);
      setInventory(next);
      refreshExpiryNotifications(next);
    },
    [activeId],
  );

  const updateVial = useCallback(
    async (vial: VialRecord) => {
      if (!activeId) return;
      const next = await updateVialRecord(activeId, vial);
      setInventory(next);
      refreshExpiryNotifications(next);
    },
    [activeId],
  );

  const removeVial = useCallback(
    async (vialId: string) => {
      if (!activeId) return;
      const next = await deleteVialRecord(activeId, vialId);
      setInventory(next);
      refreshExpiryNotifications(next);
    },
    [activeId],
  );

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;

  const value: AppContextValue = {
    loading,
    profiles,
    activeProfileId: activeId,
    activeProfile,
    inventory,
    reloadInventory,
    createProfile,
    renameProfile,
    switchProfile,
    removeProfile,
    addVial,
    updateVial,
    removeVial,
    canAddProfile: profiles.length < MAX_PROFILES,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
