// Add a vial in Powder or Reconstituted mode. Supports prefill from the
// Library detail screen and the Calculator's "Save to Inventory" action.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import PeptidePicker from '../../components/PeptidePicker';
import DateField from '../../components/DateField';
import { useApp } from '../../context/AppContext';
import { peptideDatabase } from '../../data/peptideDatabase';
import { StorageLocation, VialRecord, VialStatus } from '../../types';
import { generateId } from '../../utils/storageUtils';
import { InventoryStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';

const STORAGE_OPTS: { key: StorageLocation; label: string; icon: any }[] = [
  { key: 'freezer', label: 'Freezer', icon: 'snowflake' },
  { key: 'fridge', label: 'Fridge', icon: 'fridge-outline' },
  { key: 'room_temp', label: 'Room Temp', icon: 'thermometer' },
];

export default function AddVialScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<InventoryStackParamList, 'AddVial'>>();
  const prefill = route.params?.prefill;
  const { activeProfileId, addVial } = useApp();

  const [status, setStatus] = useState<VialStatus>(prefill?.status ?? 'powder');
  const [peptideId, setPeptideId] = useState<string | null>(
    prefill?.peptideId ?? null,
  );
  const [peptideName, setPeptideName] = useState(prefill?.peptideName ?? '');
  const [vialSizeText, setVialSizeText] = useState(
    prefill?.vialSizeMg != null ? String(prefill.vialSizeMg) : '',
  );
  const [bacText, setBacText] = useState(
    prefill?.bacWaterMl != null ? String(prefill.bacWaterMl) : '',
  );
  const [dateReceived, setDateReceived] = useState(new Date());
  const [dateReconstituted, setDateReconstituted] = useState(new Date());
  const [storage, setStorage] = useState<StorageLocation>(
    prefill?.status === 'reconstituted' ? 'fridge' : 'freezer',
  );
  const [notes, setNotes] = useState('');

  const selectedPeptide = useMemo(
    () => peptideDatabase.find((p) => p.id === peptideId),
    [peptideId],
  );

  const vialSize = parseFloat(vialSizeText);
  const bac = parseFloat(bacText);
  const validVial = isFinite(vialSize) && vialSize > 0;
  const validBac = isFinite(bac) && bac > 0;
  const concentration = validVial && validBac ? vialSize / bac : 0;

  const setStatusMode = (next: VialStatus) => {
    setStatus(next);
    if (next === 'reconstituted' && storage === 'freezer') setStorage('fridge');
  };

  const handleSave = () => {
    if (!activeProfileId) return;
    if (!peptideName.trim()) {
      Alert.alert('Missing peptide', 'Please select or enter a peptide name.');
      return;
    }
    if (!validVial) {
      Alert.alert('Missing vial size', 'Please enter a valid vial size in mg.');
      return;
    }
    if (status === 'reconstituted' && !validBac) {
      Alert.alert('Missing BAC water', 'Please enter the BAC water volume.');
      return;
    }

    const vial: VialRecord = {
      id: generateId(),
      profileId: activeProfileId,
      peptideId: peptideId ?? `manual-${generateId()}`,
      peptideName: peptideName.trim(),
      vialSizeMg: vialSize,
      status,
      dateReceived: dateReceived.toISOString(),
      storageLocation: storage,
      notes: notes.trim() || undefined,
      doseLogs: [],
      ...(status === 'reconstituted'
        ? {
            dateReconstituted: dateReconstituted.toISOString(),
            bacWaterMl: bac,
            concentrationMgPerMl: Math.round(concentration * 10000) / 10000,
            remainingVolumeMl: bac,
          }
        : {}),
    };

    addVial(vial);
    navigation.goBack();
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mode toggle */}
          <View style={styles.segment}>
            {(['powder', 'reconstituted'] as VialStatus[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatusMode(s)}
                style={[styles.segmentBtn, status === s && styles.segmentActive]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    status === s && styles.segmentTextActive,
                  ]}
                >
                  {s === 'powder' ? 'Powder' : 'Reconstituted'}
                </Text>
              </Pressable>
            ))}
          </View>

          <PeptidePicker
            peptideId={peptideId}
            peptideName={peptideName}
            onChange={(id, name) => {
              setPeptideId(id);
              setPeptideName(name);
            }}
          />

          {/* Vial size */}
          <Text style={styles.label}>Vial size (mg)</Text>
          {selectedPeptide && selectedPeptide.commonVialSizes.length > 0 && (
            <View style={styles.chipRow}>
              {selectedPeptide.commonVialSizes.map((v) => {
                const active = parseFloat(vialSizeText) === v.mg;
                return (
                  <Pressable
                    key={v.mg}
                    onPress={() => setVialSizeText(String(v.mg))}
                    style={[styles.sizeChip, active && styles.sizeChipActive]}
                  >
                    <Text
                      style={[styles.sizeChipText, active && styles.sizeChipTextActive]}
                    >
                      {v.mg} mg
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <TextInput
            value={vialSizeText}
            onChangeText={setVialSizeText}
            keyboardType="decimal-pad"
            placeholder="e.g. 5"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          {/* Reconstituted-only fields */}
          {status === 'reconstituted' && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>
                BAC water added (mL)
              </Text>
              <TextInput
                value={bacText}
                onChangeText={setBacText}
                keyboardType="decimal-pad"
                placeholder="e.g. 2"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />
              {validVial && validBac && (
                <Text style={styles.helper}>
                  Concentration: {concentration.toFixed(3)} mg/mL ·{' '}
                  {((concentration * 1000) / 100).toFixed(1)} mcg/unit
                </Text>
              )}
              <View style={{ marginTop: 16 }}>
                <DateField
                  label="Date reconstituted"
                  value={dateReconstituted}
                  onChange={setDateReconstituted}
                  maximumDate={new Date()}
                />
              </View>
            </>
          )}

          <View style={{ marginTop: status === 'reconstituted' ? 0 : 16 }}>
            <DateField
              label="Date received"
              value={dateReceived}
              onChange={setDateReceived}
              maximumDate={new Date()}
            />
          </View>

          {/* Storage location */}
          <Text style={styles.label}>Storage location</Text>
          <View style={styles.storageRow}>
            {STORAGE_OPTS.map((opt) => {
              const active = storage === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setStorage(opt.key)}
                  style={[styles.storageBtn, active && styles.storageBtnActive]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={20}
                    color={active ? colors.background : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.storageText,
                      active && styles.storageTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notes */}
          <Text style={[styles.label, { marginTop: 16 }]}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Batch number, vendor, etc."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.notesInput]}
            multiline
          />

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <MaterialCommunityIcons
              name="content-save-outline"
              size={19}
              color={colors.background}
            />
            <Text style={styles.saveText}>Save Vial</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primaryAccent },
  segmentText: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.textSecondary },
  segmentTextActive: { color: colors.background },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 7,
  },
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
  notesInput: { minHeight: 64, textAlignVertical: 'top' },
  helper: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.primaryAccent,
    marginTop: 7,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeChipActive: { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
  sizeChipText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  sizeChipTextActive: { color: colors.background, fontFamily: fontFamily.semiBold },
  storageRow: { flexDirection: 'row', gap: 10 },
  storageBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storageBtnActive: { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
  storageText: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.textSecondary },
  storageTextActive: { color: colors.background, fontFamily: fontFamily.semiBold },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 17,
    marginTop: 26,
  },
  saveText: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.background },
});
