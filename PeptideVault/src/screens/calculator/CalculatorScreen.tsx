// Calculator with three modes:
//   1) Dose to Units   2) Units to Water   3) Suggested Dose
// All recompute live, render math steps + a syringe visual, and offer
// Save to Inventory / Clear.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import SyringeVisual from '../../components/SyringeVisual';
import PeptidePicker from '../../components/PeptidePicker';
import { peptideDatabase } from '../../data/peptideDatabase';
import {
  calcUnitsFromDose,
  calcBacWaterFromUnits,
  calcFromSuggestedDose,
  toMcg,
} from '../../utils/calculatorUtils';
import { DoseUnit } from '../../types';
import { colors } from '../../theme/colors';
import { fontFamily, cardStyle } from '../../theme/typography';

type Mode = 1 | 2 | 3;
type Level = 'low' | 'moderate' | 'high';

const MODES: { key: Mode; label: string }[] = [
  { key: 1, label: 'Dose → Units' },
  { key: 2, label: 'Units → Water' },
  { key: 3, label: 'Suggested' },
];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
    </View>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: DoseUnit;
  onChange: (u: DoseUnit) => void;
}) {
  return (
    <View style={styles.unitToggle}>
      {(['mcg', 'mg'] as DoseUnit[]).map((u) => (
        <Pressable
          key={u}
          onPress={() => onChange(u)}
          style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
        >
          <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MathSteps({ steps }: { steps: string[] }) {
  return (
    <View style={styles.mathCard}>
      <Text style={styles.mathTitle}>Math Steps</Text>
      {steps.map((s, i) => (
        <Text key={i} style={styles.mathStep}>
          {s}
        </Text>
      ))}
    </View>
  );
}

export default function CalculatorScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>(1);

  // Mode 1 + 2 shared-ish inputs
  const [vialMg, setVialMg] = useState('');
  const [bacWater, setBacWater] = useState('');
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg');
  const [units, setUnits] = useState('');

  // Mode 3 inputs
  const [pepId, setPepId] = useState<string | null>(null);
  const [pepName, setPepName] = useState('');
  const [level, setLevel] = useState<Level>('moderate');
  const [m3VialMg, setM3VialMg] = useState('');
  const [m3Bac, setM3Bac] = useState('');

  const selectedPeptide = useMemo(
    () => peptideDatabase.find((p) => p.id === pepId),
    [pepId],
  );

  // Auto-populate Mode 3 BAC water from the reconstitution ratio for the size.
  useEffect(() => {
    if (!selectedPeptide) return;
    const sizeNum = parseFloat(m3VialMg);
    const ratio = selectedPeptide.reconstitutionRatios.find(
      (r) => r.vialMg === sizeNum,
    );
    if (ratio) setM3Bac(String(ratio.recommendedBacWaterMl));
  }, [m3VialMg, selectedPeptide]);

  const result = useMemo(() => {
    if (mode === 1) {
      const v = parseFloat(vialMg);
      const b = parseFloat(bacWater);
      const d = parseFloat(dose);
      if (![v, b, d].every((n) => isFinite(n))) return null;
      return calcUnitsFromDose(v, b, toMcg(d, doseUnit));
    }
    if (mode === 2) {
      const v = parseFloat(vialMg);
      const u = parseFloat(units);
      const d = parseFloat(dose);
      if (![v, u, d].every((n) => isFinite(n)) || u <= 0) return null;
      return calcBacWaterFromUnits(v, u, toMcg(d, doseUnit));
    }
    // mode 3
    const v = parseFloat(m3VialMg);
    const b = parseFloat(m3Bac);
    if (!pepId || ![v, b].every((n) => isFinite(n)) || b <= 0) return null;
    return calcFromSuggestedDose(pepId, level, v, b);
  }, [mode, vialMg, bacWater, dose, doseUnit, units, pepId, level, m3VialMg, m3Bac]);

  const clearAll = () => {
    setVialMg('');
    setBacWater('');
    setDose('');
    setUnits('');
    setM3VialMg('');
    setM3Bac('');
    setPepId(null);
    setPepName('');
  };

  const saveToInventory = () => {
    const prefill =
      mode === 3
        ? {
            peptideId: pepId ?? undefined,
            peptideName: pepName,
            vialSizeMg: parseFloat(m3VialMg) || undefined,
            bacWaterMl: parseFloat(m3Bac) || undefined,
            status: 'reconstituted' as const,
          }
        : {
            vialSizeMg: parseFloat(vialMg) || undefined,
            bacWaterMl:
              mode === 1
                ? parseFloat(bacWater) || undefined
                : result?.bacWaterMl || undefined,
            status: 'reconstituted' as const,
          };
    navigation.navigate('InventoryTab', { screen: 'AddVial', params: { prefill } });
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Calculator</Text>

          {/* Mode segmented control */}
          <View style={styles.segment}>
            {MODES.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[styles.segmentBtn, mode === m.key && styles.segmentActive]}
              >
                <Text
                  style={[styles.segmentText, mode === m.key && styles.segmentTextActive]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Mode 1 ── */}
          {mode === 1 && (
            <View style={styles.inputCard}>
              <Field label="Vial size (mg)" value={vialMg} onChangeText={setVialMg} placeholder="e.g. 5" />
              <Field label="BAC water added (mL)" value={bacWater} onChangeText={setBacWater} placeholder="e.g. 2" />
              <Text style={styles.label}>Desired dose</Text>
              <View style={styles.row}>
                <TextInput
                  value={dose}
                  onChangeText={setDose}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 250"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { flex: 1 }]}
                />
                <UnitToggle unit={doseUnit} onChange={setDoseUnit} />
              </View>
            </View>
          )}

          {/* ── Mode 2 ── */}
          {mode === 2 && (
            <View style={styles.inputCard}>
              <Field label="Vial size (mg)" value={vialMg} onChangeText={setVialMg} placeholder="e.g. 5" />
              <Field label="Units to draw (U-100)" value={units} onChangeText={setUnits} placeholder="e.g. 20" />
              <Text style={styles.label}>Desired dose</Text>
              <View style={styles.row}>
                <TextInput
                  value={dose}
                  onChangeText={setDose}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 250"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { flex: 1 }]}
                />
                <UnitToggle unit={doseUnit} onChange={setDoseUnit} />
              </View>
            </View>
          )}

          {/* ── Mode 3 ── */}
          {mode === 3 && (
            <View style={styles.inputCard}>
              <PeptidePicker
                peptideId={pepId}
                peptideName={pepName}
                allowManual={false}
                onChange={(id, name) => {
                  setPepId(id);
                  setPepName(name);
                  setM3VialMg('');
                  setM3Bac('');
                }}
              />

              <Text style={styles.label}>Dosing level</Text>
              <View style={styles.levelRow}>
                {(['low', 'moderate', 'high'] as Level[]).map((lvl) => (
                  <Pressable
                    key={lvl}
                    onPress={() => setLevel(lvl)}
                    style={[styles.levelBtn, level === lvl && styles.levelBtnActive]}
                  >
                    <Text
                      style={[styles.levelText, level === lvl && styles.levelTextActive]}
                    >
                      {lvl[0].toUpperCase() + lvl.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {selectedPeptide && (
                <>
                  <Text style={styles.label}>Vial size</Text>
                  <View style={styles.chipRow}>
                    {selectedPeptide.commonVialSizes.map((v) => {
                      const active = parseFloat(m3VialMg) === v.mg;
                      return (
                        <Pressable
                          key={v.mg}
                          onPress={() => setM3VialMg(String(v.mg))}
                          style={[styles.sizeChip, active && styles.sizeChipActive]}
                        >
                          <Text
                            style={[
                              styles.sizeChipText,
                              active && styles.sizeChipTextActive,
                            ]}
                          >
                            {v.mg} mg
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Field
                    label="BAC water (mL) — auto, editable"
                    value={m3Bac}
                    onChangeText={setM3Bac}
                    placeholder="auto from ratios"
                  />
                </>
              )}
              {!selectedPeptide && (
                <Text style={styles.hint}>Select a peptide to continue.</Text>
              )}
            </View>
          )}

          {/* ── Result ── */}
          {result && (
            <>
              <View style={styles.resultCard}>
                {mode === 2 ? (
                  <Text style={styles.resultText}>
                    Add{' '}
                    <Text style={styles.resultAccent}>
                      {result.bacWaterMl} mL
                    </Text>{' '}
                    of BAC water to your vial
                  </Text>
                ) : (
                  <>
                    {mode === 3 && result.suggestedDoseMcg != null && (
                      <Text style={styles.suggestedDose}>
                        Suggested dose: {result.suggestedDoseMcg} mcg
                      </Text>
                    )}
                    <Text style={styles.resultText}>
                      Draw{' '}
                      <Text style={styles.resultAccent}>
                        {result.unitsToDrawOnSyringe} units
                      </Text>{' '}
                      on a U-100 syringe
                    </Text>
                  </>
                )}
              </View>

              <MathSteps steps={result.mathSteps} />

              <View style={styles.syringeWrap}>
                <SyringeVisual targetUnits={result.unitsToDrawOnSyringe} />
              </View>
            </>
          )}

          {/* ── Actions ── */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.saveBtn, !result && styles.disabled]}
              onPress={saveToInventory}
              disabled={!result}
            >
              <MaterialCommunityIcons
                name="archive-plus-outline"
                size={18}
                color={colors.background}
              />
              <Text style={styles.saveText}>Save to Inventory</Text>
            </Pressable>
            <Pressable style={styles.clearBtn} onPress={clearAll}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  title: { fontFamily: fontFamily.bold, fontSize: 30, color: colors.textPrimary, marginBottom: 16 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primaryAccent },
  segmentText: { fontFamily: fontFamily.semiBold, fontSize: 12, color: colors.textSecondary },
  segmentTextActive: { color: colors.background },
  inputCard: { ...cardStyle, marginBottom: 18 },
  fieldWrap: { marginBottom: 16 },
  label: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 7 },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9 },
  unitBtnActive: { backgroundColor: colors.primaryAccent },
  unitText: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.textSecondary },
  unitTextActive: { color: colors.background },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  levelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelBtnActive: { backgroundColor: colors.secondaryAccent, borderColor: colors.secondaryAccent },
  levelText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  levelTextActive: { color: colors.textPrimary, fontFamily: fontFamily.semiBold },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeChipActive: { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
  sizeChipText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  sizeChipTextActive: { color: colors.background, fontFamily: fontFamily.semiBold },
  hint: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  resultCard: {
    ...cardStyle,
    backgroundColor: colors.primaryAccentDim,
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedDose: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.secondaryAccent,
    marginBottom: 6,
  },
  resultText: { fontFamily: fontFamily.medium, fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
  resultAccent: { fontFamily: fontFamily.bold, color: colors.primaryAccent, fontSize: 18 },
  mathCard: { ...cardStyle, marginBottom: 16 },
  mathTitle: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary, marginBottom: 10 },
  mathStep: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  syringeWrap: { alignItems: 'center', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  disabled: { opacity: 0.4 },
  saveText: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.background },
  clearBtn: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.textSecondary },
});
