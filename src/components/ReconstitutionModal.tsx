// Modal that transitions a powder vial to reconstituted status. Live-computes
// concentration, mcg/unit, and units-to-draw for the peptide's low/mod/high
// doses as the user enters a BAC water volume.

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
import { VialRecord } from '../types';
import { peptideDatabase } from '../data/peptideDatabase';
import { calcUnitsFromDose } from '../utils/calculatorUtils';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import DateField from './DateField';

interface Props {
  visible: boolean;
  vial: VialRecord;
  onClose: () => void;
  onConfirm: (updated: VialRecord) => void;
}

export default function ReconstitutionModal({
  visible,
  vial,
  onClose,
  onConfirm,
}: Props) {
  const [bacText, setBacText] = useState('');
  const [date, setDate] = useState(new Date());

  const peptide = useMemo(
    () => peptideDatabase.find((p) => p.id === vial.peptideId),
    [vial.peptideId],
  );

  const bac = parseFloat(bacText);
  const validBac = isFinite(bac) && bac > 0;
  const concentration = validBac ? vial.vialSizeMg / bac : 0;
  const mcgPerUnit = (concentration * 1000) / 100;

  const doseRows = useMemo(() => {
    if (!peptide || !validBac) return [];
    const levels: ('low' | 'moderate' | 'high')[] = ['low', 'moderate', 'high'];
    return levels.map((lvl) => {
      const doseMcg =
        peptide.dosingRanges.unit === 'mg'
          ? peptide.dosingRanges[lvl] * 1000
          : peptide.dosingRanges[lvl];
      const res = calcUnitsFromDose(vial.vialSizeMg, bac, doseMcg);
      return {
        level: lvl,
        rawDose: peptide.dosingRanges[lvl],
        unit: peptide.dosingRanges.unit,
        units: res.unitsToDrawOnSyringe,
      };
    });
  }, [peptide, validBac, bac, vial.vialSizeMg]);

  const handleConfirm = () => {
    if (!validBac) return;
    onConfirm({
      ...vial,
      status: 'reconstituted',
      bacWaterMl: bac,
      concentrationMgPerMl: Math.round(concentration * 10000) / 10000,
      dateReconstituted: date.toISOString(),
      remainingVolumeMl: bac,
      storageLocation:
        vial.storageLocation === 'room_temp' ? 'fridge' : vial.storageLocation,
    });
    setBacText('');
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
            <Text style={styles.title}>Reconstitute Vial</Text>
            <Text style={styles.subtitle}>
              {vial.peptideName} · {vial.vialSizeMg} mg
            </Text>

            <Text style={styles.label}>BAC water added (mL)</Text>
            <TextInput
              value={bacText}
              onChangeText={setBacText}
              keyboardType="decimal-pad"
              placeholder="e.g. 2"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />

            {validBac && (
              <View style={styles.resultBox}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Concentration</Text>
                  <Text style={styles.resultValue}>
                    {concentration.toFixed(3)} mg/mL
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Per U-100 unit</Text>
                  <Text style={styles.resultValue}>
                    {mcgPerUnit.toFixed(2)} mcg/unit
                  </Text>
                </View>
              </View>
            )}

            {doseRows.length > 0 && (
              <View style={styles.table}>
                <Text style={styles.tableTitle}>Units to draw per dose</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1.2 }]}>Level</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Dose</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>
                    Units
                  </Text>
                </View>
                {doseRows.map((r) => (
                  <View key={r.level} style={styles.tableRow}>
                    <Text style={[styles.td, styles.tdCap, { flex: 1.2 }]}>
                      {r.level}
                    </Text>
                    <Text style={[styles.td, { flex: 1 }]}>
                      {r.rawDose} {r.unit}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.tdAccent,
                        { flex: 1, textAlign: 'right' },
                      ]}
                    >
                      {r.units}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <DateField
                label="Date reconstituted"
                value={date}
                onChange={setDate}
                maximumDate={new Date()}
              />
            </View>

            <Pressable
              onPress={handleConfirm}
              disabled={!validBac}
              style={[styles.confirmBtn, !validBac && styles.disabled]}
            >
              <MaterialCommunityIcons
                name="beaker-check-outline"
                size={18}
                color={colors.background}
              />
              <Text style={styles.confirmText}>Confirm Reconstitution</Text>
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
    maxHeight: '90%',
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 18,
  },
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
  resultBox: {
    backgroundColor: colors.primaryAccentDim,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultValue: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.primaryAccent,
  },
  table: {
    marginTop: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  tableTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
  },
  td: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  tdCap: { textTransform: 'capitalize' },
  tdAccent: {
    fontFamily: fontFamily.bold,
    color: colors.primaryAccent,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 22,
  },
  disabled: { opacity: 0.4 },
  confirmText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.background,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
