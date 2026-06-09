// Core application data types for PeptideVault.
// PeptideEntry lives in src/data/peptideDatabase.ts and is re-exported here
// for convenience so consumers can import all types from one place.

export type { PeptideEntry } from '../data/peptideDatabase';

export interface Profile {
  id: string;
  name: string;
  createdAt: string; // ISO string
}

export interface DoseLog {
  id: string;
  date: string; // ISO string
  doseAmount: number;
  doseUnit: 'mcg' | 'mg';
  unitsDrawn: number; // U-100 syringe units
  notes?: string;
}

export interface VialRecord {
  id: string;
  profileId: string;
  peptideId: string; // references PeptideEntry id
  peptideName: string; // denormalized for display (survives DB removal)
  vialSizeMg: number;
  status: 'powder' | 'reconstituted';
  dateReceived: string; // ISO string
  dateReconstituted?: string; // ISO string
  bacWaterMl?: number;
  concentrationMgPerMl?: number;
  remainingVolumeMl?: number;
  storageLocation: 'freezer' | 'fridge' | 'room_temp';
  notes?: string;
  doseLogs: DoseLog[];
}

export interface CalculatorResult {
  mode: number; // 1, 2, or 3 (kept as number for broad transpiler support)
  vialMg: number;
  bacWaterMl: number;
  concentrationMgPerMl: number;
  desiredDose?: number;
  doseUnit?: 'mcg' | 'mg';
  unitsToDrawOnSyringe: number;
  suggestedDoseMcg?: number;
  mathSteps: string[];
}

export type StorageLocation = VialRecord['storageLocation'];
export type VialStatus = VialRecord['status'];
export type DoseUnit = DoseLog['doseUnit'];

// Expiry status used by the ExpiryBadge component and notification logic.
export type ExpiryStatus = 'ok' | 'warning' | 'expired';

export interface ExpiryInfo {
  status: ExpiryStatus;
  daysRemaining: number; // can be negative when expired
  totalDays: number;
  expiryDate: Date;
}
