// Expiry computation + local notification scheduling.
//
// Powder vials:        expiry = dateReceived + powderDays
// Reconstituted vials: expiry = dateReconstituted + reconstitutedFridgeDays
// Warning threshold:   when >= 80% of the stability window has elapsed.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExpiryInfo, ExpiryStatus, VialRecord } from '../types';
import { peptideDatabase, PeptideEntry } from '../data/peptideDatabase';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const WARNING_FRACTION = 0.8;

// Fallback stability windows when a peptide is missing from the DB.
const FALLBACK_POWDER_DAYS = 365;
const FALLBACK_RECON_DAYS = 28;

function lookupPeptide(peptideId: string): PeptideEntry | undefined {
  return peptideDatabase.find((p) => p.id === peptideId);
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Compute expiry info for a vial relative to `now` (defaults to current time).
 * Returns null only if required dates are missing/invalid.
 */
export function getExpiryInfo(
  vial: VialRecord,
  now: Date = new Date(),
): ExpiryInfo | null {
  const peptide = lookupPeptide(vial.peptideId);
  let totalDays: number;
  let startDateStr: string | undefined;

  if (vial.status === 'reconstituted') {
    startDateStr = vial.dateReconstituted ?? vial.dateReceived;
    totalDays =
      peptide?.stability.reconstitutedFridgeDays ?? FALLBACK_RECON_DAYS;
  } else {
    startDateStr = vial.dateReceived;
    totalDays = peptide?.stability.powderDays ?? FALLBACK_POWDER_DAYS;
  }

  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;
  if (!totalDays || totalDays <= 0) totalDays = FALLBACK_RECON_DAYS;

  const expiryDate = new Date(start.getTime() + totalDays * MS_PER_DAY);
  const daysRemaining = daysBetween(now, expiryDate);
  const elapsed = totalDays - daysRemaining;

  let status: ExpiryStatus = 'ok';
  if (daysRemaining < 0) {
    status = 'expired';
  } else if (elapsed >= totalDays * WARNING_FRACTION) {
    status = 'warning';
  }

  return { status, daysRemaining, totalDays, expiryDate };
}

// ── Notification handler / permissions ───────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry', {
        name: 'Expiry warnings',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/**
 * Cancel all previously scheduled expiry notifications and reschedule one for
 * every vial currently in the warning (or expired) window. Called on each
 * foreground transition to keep notifications accurate.
 */
export async function refreshExpiryNotifications(
  vials: VialRecord[],
): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    for (const vial of vials) {
      const info = getExpiryInfo(vial, now);
      if (!info) continue;
      if (info.status === 'ok') continue;

      const title =
        info.status === 'expired'
          ? `${vial.peptideName} expired`
          : `${vial.peptideName} expiring soon`;
      const body =
        info.status === 'expired'
          ? `This vial has expired (${Math.abs(info.daysRemaining)} days past).`
          : `This vial has ${info.daysRemaining} days remaining.`;

      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null, // deliver promptly on this foreground check
      });
    }
  } catch {
    // Notifications are best-effort; never block app foregrounding.
  }
}

// Count helpers used by the Home screen stat cards.
export function summarizeInventory(vials: VialRecord[], now: Date = new Date()) {
  let active = 0;
  let expiringSoon = 0;
  let expired = 0;
  for (const vial of vials) {
    const info = getExpiryInfo(vial, now);
    if (!info) {
      active += 1;
      continue;
    }
    if (info.status === 'expired') {
      expired += 1;
    } else if (info.status === 'warning') {
      expiringSoon += 1;
      active += 1;
    } else {
      active += 1;
    }
  }
  return { active, expiringSoon, expired };
}
