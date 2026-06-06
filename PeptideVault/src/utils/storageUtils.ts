// AsyncStorage persistence layer. All app data lives on-device per profile.
//
// Keys (exact):
//   profiles            -> JSON array of Profile
//   activeProfileId     -> active profile id string
//   inventory_<id>      -> JSON array of VialRecord for that profile
//   disclaimerAccepted  -> boolean
//   lastTipDate         -> ISO date string (home screen rotating tip)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, VialRecord } from '../types';

export const STORAGE_KEYS = {
  profiles: 'profiles',
  activeProfileId: 'activeProfileId',
  inventoryPrefix: 'inventory_',
  disclaimerAccepted: 'disclaimerAccepted',
  lastTipDate: 'lastTipDate',
} as const;

export const MAX_PROFILES = 5;

const inventoryKey = (profileId: string) =>
  `${STORAGE_KEYS.inventoryPrefix}${profileId}`;

// ── Profiles ────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.profiles);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    return [];
  }
}

export async function saveProfiles(profiles: Profile[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.activeProfileId);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.activeProfileId, id);
}

// ── Inventory ───────────────────────────────────────────────────────────

export async function getInventory(profileId: string): Promise<VialRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(inventoryKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VialRecord[]) : [];
  } catch {
    return [];
  }
}

export async function saveInventory(
  profileId: string,
  vials: VialRecord[],
): Promise<void> {
  await AsyncStorage.setItem(inventoryKey(profileId), JSON.stringify(vials));
}

export async function addVialRecord(
  profileId: string,
  vial: VialRecord,
): Promise<VialRecord[]> {
  const current = await getInventory(profileId);
  const next = [...current, vial];
  await saveInventory(profileId, next);
  return next;
}

export async function updateVialRecord(
  profileId: string,
  updated: VialRecord,
): Promise<VialRecord[]> {
  const current = await getInventory(profileId);
  const next = current.map((v) => (v.id === updated.id ? updated : v));
  await saveInventory(profileId, next);
  return next;
}

export async function deleteVialRecord(
  profileId: string,
  vialId: string,
): Promise<VialRecord[]> {
  const current = await getInventory(profileId);
  const next = current.filter((v) => v.id !== vialId);
  await saveInventory(profileId, next);
  return next;
}

// ── Misc flags ──────────────────────────────────────────────────────────

export async function getDisclaimerAccepted(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.disclaimerAccepted);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setDisclaimerAccepted(value: boolean): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.disclaimerAccepted,
    value ? 'true' : 'false',
  );
}

export async function getLastTipDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.lastTipDate);
  } catch {
    return null;
  }
}

export async function setLastTipDate(iso: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.lastTipDate, iso);
}

// Remove a profile and its inventory bucket entirely.
export async function deleteProfile(profileId: string): Promise<Profile[]> {
  const profiles = await getProfiles();
  const next = profiles.filter((p) => p.id !== profileId);
  await saveProfiles(next);
  await AsyncStorage.removeItem(inventoryKey(profileId));
  return next;
}

// Simple unique id generator (no external deps; offline-safe).
export function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}
