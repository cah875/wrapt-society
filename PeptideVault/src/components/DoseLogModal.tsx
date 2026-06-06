// Modal to log a dose against a reconstituted vial. Two entry modes:
//   • By dose  — enter mcg/mg, see units to draw
//   • By units — enter U-100 units, see the resulting dose
// Saving appends to doseLogs and decrements remainingVolumeMl.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VialRecord, DoseLog, DoseUnit } from '../types';
import { generateId } from '../utils/storageUtils';
import { volumeFromUnits } from '../utils/calculatorUtils';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import SyringeVisual from './SyringeVisual';
import DateField from './DateField';

interface Props {
  visible: boolean;
  vial: VialRecord;
  onClose: () => void;
  onSave: (updated: VialRecord) => void;
}

type EntryMode = 'dose' | 'units';

export default function DoseLogModal({ visible, vial, onClose, onSave }: Props) {
  const [entryMode, setEntryMode] = useState<EntryMode>('dose');
  const [doseText, setDoseText] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg');
  const [unitsText, setUnitsText] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  const concentration = vial.concentrationMgPerMl ?? 0;
  const mcgPerUnit = (concentration * 1000) / 100;

  // Derive units + dose(mcg) from whichever input the user is editing.
  const { unitsToDraw, doseMcg } = useMemo(() => {
    if (entryMode === 'dose') {
      const raw = parseFloat(doseText);
      const mcg = isFinite(raw) ? (doseUnit === 'mg' ? raw * 1000 : raw) : 0;
      const u = mcgPerUnit > 0 ? mcg / mcgPerUnit : 0;
      return { unitsToDraw: Math.round(u * 10) / 10, doseMcg: mcg };
    }
    const u = parseFloat(unitsText);
    const units = isFinite(u) ? u : 0;
    const mcg = units * mcgPerUnit;
    return { unitsToDraw: Math.round(units * 10) / 10, doseMcg: mcg };
  }, [entryMode, doseText, doseUnit, unitsText, mcgPerUnit]);

  const remaining = vial.remainingVolumeMl ?? 0;
  const volumeNeeded = volumeFromUnits(unitsToDraw);
  const insufficient = volumeNeeded > remaining + 1e-6;
  const canSave = unitsToDraw > 0 && doseMcg > 0;

  const handleSave = () => {
    if (!canSave) return;
    const log: DoseLog = {
      id: generateId(),
      date: date.toISOString(),
      doseAmount:
        entryMode === 'dose'
          ? parseFloat(doseText)
          : Math.round((doseMcg / (doseUnit === 'mg' ? 1000 : 1)) * 100) / 100,
      doseUnit,
      unitsDrawn: unitsToDraw,
      notes: notes.trim() || undefined,
    };
    const newRemaining = Math.max(0, remaining - volumeNeeded);
    onSave({
      ...vial,
      remainingVolumeMl: Math.round(newRemaining * 10000) / 10000,
      doseLogs: [log, ...vial.doseLogs],
    });
    // reset
    setDoseText('');
    setUnitsText('');
    setNotes('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.handleBar} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Log a Dose</Text>
            <Text style={styles.subtitle}>
              {vial.peptideName} · {concentration.toFixed(3)} mg/mL (
              {mcgPerUnit.toFixed(1)} mcg/unit)
            </Text>

            {/* Entry mode toggle */}
            <View style={styles.segment}>
              {(['dose', 'units'] as EntryMode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setEntryMode(m)}
                  style={[styles.segmentBtn, entryMode === m && styles.segmentActive]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      entryMode === m && styles.segmentTextActive,
                    ]}
                  >
                    {m === 'dose' ? 'By dose' : 'By units'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {entryMode === 'dose' ? (
              <>
                <Text style={styles.label}>Desired dose</Text>
                <View style={styles.row}>
                  <TextInput
                    value={doseText}
                    onChangeText={setDoseText}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <View style={styles.unitToggle}>
                    {(['mcg', 'mg'] as DoseUnit[]).map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => setDoseUnit(u)}
                        style={[
                          styles.unitBtn,
                          doseUnit === u && styles.unitBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitText,
                            doseUnit === u && styles.unitTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Units to draw (U-100)</Text>
                <TextInput
                  value={unitsText}
                  onChangeText={setUnitsText}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
              </>
            )}

            {/* Computed readout */}
            <View style={styles.readout}>
              {entryMode === 'dose' ? (
                <Text style={styles.readoutText}>
                  Draw{' '}
                  <Text style={styles.readoutAccent}>{unitsToDraw} units</Text> on
                  a U-100 syringe
                </Text>
              ) : (
                <Text style={styles.readoutText}>
                  That equals{' '}
                  <Text style={styles.readoutAccent}>
                    {doseMcg.toFixed(1)} mcg
                  </Text>
                </Text>
              )}
            </View>

            <View style={styles.syringeWrap}>
              <SyringeVisual targetUnits={unitsToDraw} />
            </View>

            {insufficient && (
              <Text style={styles.warnText}>
                Only {remaining.toFixed(2)} mL remaining — this dose needs{' '}
                {volumeNeeded.toFixed(2)} mL.
              </Text>
            )}

            <DateField
              label="Date & time"
              value={date}
              onChange={setDate}
              mode="datetime"
              maximumDate={new Date()}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. left abdomen"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.notesInput]}
              multiline
            />

            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[styles.saveBtn, !canSave && styles.disabled]}
            >
              <MaterialCommunityIcons
                name="needle"
                size={18}
                color={colors.background}
              />
              <Text style={styles.saveText}>Save Dose</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '92%',
  },
  handleBar: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primaryAccent },
  segmentText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  segmentTextActive: { color: colors.background },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 7,
    marginTop: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  notesInput: { minHeight: 56, textAlignVertical: 'top' },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
  },
  unitBtnActive: { backgroundColor: colors.primaryAccent },
  unitText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  unitTextActive: { color: colors.background },
  readout: {
    marginTop: 16,
    backgroundColor: colors.primaryAccentDim,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  readoutText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  readoutAccent: {
    fontFamily: fontFamily.bold,
    color: colors.primaryAccent,
  },
  syringeWrap: { alignItems: 'center', marginVertical: 18 },
  warnText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 14,
  },
  disabled: { opacity: 0.4 },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.background,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
