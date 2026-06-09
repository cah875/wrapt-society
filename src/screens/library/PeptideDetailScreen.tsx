// Full detail view for a single peptide: overview, dosing, reconstitution
// table, storage, side effects, contraindications, stack & research notes.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import { peptideDatabase } from '../../data/peptideDatabase';
import { LibraryStackParamList } from '../../navigation/AppNavigator';
import { colors, categoryColor } from '../../theme/colors';
import { fontFamily, cardStyle } from '../../theme/typography';

function researchStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('approved') || s.includes('phase iii')) return colors.primaryAccent;
  if (s.includes('phase')) return colors.warning;
  if (s.includes('preclinical') || s.includes('research use only'))
    return colors.secondaryAccent;
  return colors.textSecondary;
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primaryAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullet({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <View style={styles.bulletRow}>
      <MaterialCommunityIcons
        name={danger ? 'alert-circle-outline' : 'circle-small'}
        size={danger ? 15 : 20}
        color={danger ? colors.danger : colors.primaryAccent}
        style={danger ? { marginTop: 2 } : undefined}
      />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function PeptideDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LibraryStackParamList, 'PeptideDetail'>>();
  const peptide = peptideDatabase.find((p) => p.id === route.params.peptideId);

  if (!peptide) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="flask-off-outline"
            size={44}
            color={colors.textSecondary}
          />
          <Text style={styles.missingText}>Peptide not found.</Text>
        </View>
      </Screen>
    );
  }

  const { dosingRanges, stability, storageInfo } = peptide;
  const maxDose = Math.max(dosingRanges.high, 1);

  const addToInventory = () =>
    navigation.navigate('InventoryTab', {
      screen: 'AddVial',
      params: {
        prefill: {
          peptideId: peptide.id,
          peptideName: peptide.name,
          vialSizeMg: peptide.commonVialSizes.find((v) => v.isCommon)?.mg,
        },
      },
    });

  const doseBar = (label: string, value: number) => (
    <View style={styles.doseRow}>
      <Text style={styles.doseLabel}>{label}</Text>
      <View style={styles.doseTrack}>
        <View
          style={[
            styles.doseFill,
            { width: `${Math.max(6, (value / maxDose) * 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.doseValue}>
        {value} {dosingRanges.unit}
      </Text>
    </View>
  );

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{peptide.name}</Text>
        {peptide.aliases.length > 0 && (
          <Text style={styles.aliases}>{peptide.aliases.join(' · ')}</Text>
        )}

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${researchStatusColor(peptide.researchStatus)}22` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: researchStatusColor(peptide.researchStatus) },
              ]}
            >
              {peptide.researchStatus}
            </Text>
          </View>
        </View>

        <View style={styles.catRow}>
          {peptide.category.map((cat) => {
            const c = categoryColor(cat);
            return (
              <View
                key={cat}
                style={[styles.catBadge, { borderColor: c, backgroundColor: `${c}1A` }]}
              >
                <Text style={[styles.catText, { color: c }]}>{cat}</Text>
              </View>
            );
          })}
        </View>

        {/* Overview */}
        <SectionCard title="Overview" icon="information-outline">
          <Text style={styles.bodyText}>{peptide.mechanism}</Text>
        </SectionCard>

        {/* Dosing */}
        <SectionCard title="Dosing Ranges" icon="chart-bar">
          {doseBar('Low', dosingRanges.low)}
          {doseBar('Moderate', dosingRanges.moderate)}
          {doseBar('High', dosingRanges.high)}
          {!!dosingRanges.titrationNotes && (
            <Text style={[styles.bodyText, { marginTop: 10 }]}>
              {dosingRanges.titrationNotes}
            </Text>
          )}
          <View style={styles.metaBadgeRow}>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons
                name="repeat"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.metaBadgeText}>{peptide.frequency}</Text>
            </View>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.metaBadgeText}>{peptide.cycleLength}</Text>
            </View>
            {dosingRanges.route.map((r) => (
              <View key={r} style={styles.metaBadge}>
                <MaterialCommunityIcons
                  name="needle"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaBadgeText}>{r}</Text>
              </View>
            ))}
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.metaBadgeText}>t½ {peptide.halfLife}</Text>
            </View>
          </View>
        </SectionCard>

        {/* Reconstitution table */}
        <SectionCard title="Reconstitution" icon="beaker-outline">
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1 }]}>Vial</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>BAC</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Conc.</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>mcg/U</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>U/100</Text>
          </View>
          {peptide.reconstitutionRatios.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1 }]}>{r.vialMg}mg</Text>
              <Text style={[styles.td, { flex: 1.2 }]}>
                {r.recommendedBacWaterMl}mL
              </Text>
              <Text style={[styles.td, { flex: 1.2 }]}>
                {r.concentrationMgPerMl}
              </Text>
              <Text style={[styles.td, { flex: 1.2 }]}>{r.mcgPerUnit}</Text>
              <Text
                style={[styles.td, styles.tdAccent, { flex: 1, textAlign: 'right' }]}
              >
                {r.unitsFor100mcg}
              </Text>
            </View>
          ))}
          <Text style={styles.tableCaption}>
            Conc. = mg/mL · mcg/U = mcg per U-100 unit · U/100 = units for 100mcg
          </Text>
        </SectionCard>

        {/* Storage */}
        <SectionCard title="Storage & Stability" icon="snowflake">
          <Text style={styles.storageLabel}>Powder</Text>
          <Text style={styles.bodyText}>{storageInfo.powder}</Text>
          {stability.powderDays != null && (
            <Text style={styles.stabilityText}>
              Stable ~{stability.powderDays} days
            </Text>
          )}
          <Text style={[styles.storageLabel, { marginTop: 12 }]}>Reconstituted</Text>
          <Text style={styles.bodyText}>{storageInfo.reconstituted}</Text>
          {stability.reconstitutedFridgeDays != null && (
            <Text style={styles.stabilityText}>
              Fridge ~{stability.reconstitutedFridgeDays} days
              {stability.reconstitutedFreezerDays != null
                ? ` · Freezer ~${stability.reconstitutedFreezerDays} days`
                : ''}
            </Text>
          )}
          {!!storageInfo.notes && (
            <Text style={[styles.bodyText, styles.noteText]}>{storageInfo.notes}</Text>
          )}
        </SectionCard>

        {/* Side effects */}
        {peptide.sideEffects.length > 0 && (
          <SectionCard title="Side Effects" icon="alert-outline">
            {peptide.sideEffects.map((s, i) => (
              <Bullet key={i} text={s} />
            ))}
          </SectionCard>
        )}

        {/* Contraindications */}
        {peptide.contraindications.length > 0 && (
          <SectionCard title="Contraindications" icon="hand-back-right-outline">
            {peptide.contraindications.map((c, i) => (
              <Bullet key={i} text={c} danger />
            ))}
          </SectionCard>
        )}

        {/* Stack notes */}
        {!!peptide.stackNotes && (
          <SectionCard title="Stack Notes" icon="layers-outline">
            <Text style={styles.bodyText}>{peptide.stackNotes}</Text>
          </SectionCard>
        )}

        {/* Research notes */}
        {!!peptide.researchNotes && (
          <SectionCard title="Research Notes" icon="book-open-page-variant-outline">
            <Text style={styles.bodyText}>{peptide.researchNotes}</Text>
          </SectionCard>
        )}

        <Text style={styles.disclaimer}>{peptide.disclaimer}</Text>

        <Pressable style={styles.addBtn} onPress={addToInventory}>
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={20}
            color={colors.background}
          />
          <Text style={styles.addText}>Add to Inventory</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  missingText: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.textSecondary },
  name: { fontFamily: fontFamily.bold, fontSize: 28, color: colors.textPrimary },
  aliases: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badgeRow: { flexDirection: 'row', marginTop: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontFamily: fontFamily.semiBold, fontSize: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  catBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  catText: { fontFamily: fontFamily.semiBold, fontSize: 10 },
  section: { ...cardStyle, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.textPrimary },
  bodyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  noteText: { color: colors.textSecondary, fontStyle: 'italic', marginTop: 10 },
  doseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  doseLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    width: 64,
  },
  doseTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  doseFill: { height: 10, borderRadius: 5, backgroundColor: colors.primaryAccent },
  doseValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
    width: 78,
    textAlign: 'right',
  },
  metaBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaBadgeText: { fontFamily: fontFamily.medium, fontSize: 11, color: colors.textSecondary },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: { flexDirection: 'row', paddingVertical: 9 },
  td: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.textPrimary },
  tdAccent: { fontFamily: fontFamily.bold, color: colors.primaryAccent },
  tableCaption: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 10,
  },
  storageLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primaryAccent,
    marginBottom: 5,
  },
  stabilityText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 7 },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  disclaimer: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 17,
    marginTop: 20,
  },
  addText: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.background },
});
