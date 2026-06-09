// Vial detail: full info, prominent expiry badge, reconstitute (powder) or
// dose-logging + remaining-volume bar (reconstituted), dose history, edit/delete.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import ExpiryBadge from '../../components/ExpiryBadge';
import ReconstitutionModal from '../../components/ReconstitutionModal';
import DoseLogModal from '../../components/DoseLogModal';
import { useApp } from '../../context/AppContext';
import { StorageLocation, VialRecord } from '../../types';
import { getExpiryInfo } from '../../utils/notificationUtils';
import { InventoryStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { fontFamily, cardStyle } from '../../theme/typography';

const STORAGE_LABEL: Record<StorageLocation, string> = {
  freezer: 'Freezer',
  fridge: 'Fridge',
  room_temp: 'Room Temp',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function VialDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<InventoryStackParamList, 'VialDetail'>>();
  const { inventory, updateVial, removeVial } = useApp();

  const vial = useMemo(
    () => inventory.find((v) => v.id === route.params.vialId),
    [inventory, route.params.vialId],
  );

  const [reconOpen, setReconOpen] = useState(false);
  const [doseOpen, setDoseOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editStorage, setEditStorage] = useState<StorageLocation>('fridge');

  if (!vial) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="flask-off-outline"
            size={42}
            color={colors.textSecondary}
          />
          <Text style={styles.missing}>This vial no longer exists.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const isRecon = vial.status === 'reconstituted';
  const info = getExpiryInfo(vial);
  const remaining = vial.remainingVolumeMl ?? 0;
  const total = vial.bacWaterMl ?? 0;
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  const startEdit = () => {
    setEditNotes(vial.notes ?? '');
    setEditStorage(vial.storageLocation);
    setEditing(true);
  };

  const saveEdit = () => {
    updateVial({ ...vial, notes: editNotes.trim() || undefined, storageLocation: editStorage });
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete vial?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeVial(vial.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{vial.peptideName}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isRecon
                    ? colors.primaryAccentDim
                    : colors.secondaryAccentDim,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isRecon ? colors.primaryAccent : colors.secondaryAccent },
                ]}
              >
                {isRecon ? 'Reconstituted' : 'Powder'}
              </Text>
            </View>
          </View>

          <View style={styles.expiryWrap}>
            <ExpiryBadge vial={vial} large />
          </View>

          <InfoRow label="Vial size" value={`${vial.vialSizeMg} mg`} />
          <InfoRow
            label="Date received"
            value={new Date(vial.dateReceived).toLocaleDateString()}
          />
          {isRecon && vial.dateReconstituted && (
            <InfoRow
              label="Reconstituted"
              value={new Date(vial.dateReconstituted).toLocaleDateString()}
            />
          )}
          {isRecon && vial.bacWaterMl != null && (
            <InfoRow label="BAC water" value={`${vial.bacWaterMl} mL`} />
          )}
          {isRecon && vial.concentrationMgPerMl != null && (
            <InfoRow
              label="Concentration"
              value={`${vial.concentrationMgPerMl} mg/mL (${(
                (vial.concentrationMgPerMl * 1000) /
                100
              ).toFixed(1)} mcg/unit)`}
            />
          )}
          <InfoRow label="Storage" value={STORAGE_LABEL[vial.storageLocation]} />
          {info && (
            <InfoRow
              label="Expires"
              value={info.expiryDate.toLocaleDateString()}
            />
          )}
          {!!vial.notes && <InfoRow label="Notes" value={vial.notes} />}
        </View>

        {/* Remaining volume bar (reconstituted) */}
        {isRecon && total > 0 && (
          <View style={styles.card}>
            <View style={styles.volHeader}>
              <Text style={styles.cardTitle}>Remaining Volume</Text>
              <Text style={styles.volValue}>
                {remaining.toFixed(2)} / {total.toFixed(2)} mL
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct * 100}%`,
                    backgroundColor:
                      pct < 0.2 ? colors.warning : colors.primaryAccent,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Action: powder -> reconstitute */}
        {!isRecon && (
          <Pressable style={styles.primaryBtn} onPress={() => setReconOpen(true)}>
            <MaterialCommunityIcons
              name="beaker-plus-outline"
              size={19}
              color={colors.background}
            />
            <Text style={styles.primaryText}>Reconstitute This Vial</Text>
          </Pressable>
        )}

        {/* Action: reconstituted -> log dose */}
        {isRecon && (
          <Pressable style={styles.primaryBtn} onPress={() => setDoseOpen(true)}>
            <MaterialCommunityIcons name="needle" size={19} color={colors.background} />
            <Text style={styles.primaryText}>Log a Dose</Text>
          </Pressable>
        )}

        {/* Dose history */}
        {isRecon && (
          <View style={styles.historySection}>
            <Text style={styles.cardTitle}>Dose History</Text>
            {vial.doseLogs.length === 0 ? (
              <Text style={styles.emptyHistory}>No doses logged yet.</Text>
            ) : (
              vial.doseLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logIcon}>
                    <MaterialCommunityIcons
                      name="needle"
                      size={16}
                      color={colors.primaryAccent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logDose}>
                      {log.doseAmount} {log.doseUnit} · {log.unitsDrawn} units
                    </Text>
                    <Text style={styles.logDate}>
                      {new Date(log.date).toLocaleString()}
                    </Text>
                    {!!log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Edit panel */}
        {editing && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Vial</Text>
            <Text style={styles.editLabel}>Notes</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Notes"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { minHeight: 56, textAlignVertical: 'top' }]}
              multiline
            />
            <Text style={styles.editLabel}>Storage</Text>
            <View style={styles.storageRow}>
              {(Object.keys(STORAGE_LABEL) as StorageLocation[]).map((k) => {
                const active = editStorage === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setEditStorage(k)}
                    style={[styles.storageBtn, active && styles.storageBtnActive]}
                  >
                    <Text
                      style={[styles.storageText, active && styles.storageTextActive]}
                    >
                      {STORAGE_LABEL[k]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.primaryBtn} onPress={saveEdit}>
              <Text style={styles.primaryText}>Save Changes</Text>
            </Pressable>
          </View>
        )}

        {/* Edit / Delete */}
        <View style={styles.bottomRow}>
          <Pressable style={styles.editBtn} onPress={editing ? () => setEditing(false) : startEdit}>
            <MaterialCommunityIcons
              name={editing ? 'close' : 'pencil-outline'}
              size={18}
              color={colors.primaryAccent}
            />
            <Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={colors.danger}
            />
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ReconstitutionModal
        visible={reconOpen}
        vial={vial}
        onClose={() => setReconOpen(false)}
        onConfirm={(updated) => {
          updateVial(updated);
          setReconOpen(false);
        }}
      />
      <DoseLogModal
        visible={doseOpen}
        vial={vial}
        onClose={() => setDoseOpen(false)}
        onSave={(updated) => {
          updateVial(updated);
          setDoseOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  missing: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.textSecondary },
  backLink: { marginTop: 8 },
  backLinkText: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.primaryAccent },
  card: { ...cardStyle, marginBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: { flex: 1, fontFamily: fontFamily.bold, fontSize: 20, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontFamily: fontFamily.semiBold, fontSize: 11 },
  expiryWrap: { marginTop: 14, marginBottom: 6 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  infoLabel: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  infoValue: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  cardTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  volHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  volValue: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.primaryAccent },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: { height: 14, borderRadius: 7 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  primaryText: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.background },
  historySection: { ...cardStyle, marginBottom: 16 },
  emptyHistory: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 14,
  },
  logRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAccentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logDose: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.textPrimary },
  logDate: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  logNotes: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 3, fontStyle: 'italic' },
  editLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 7, marginTop: 6 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  storageRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  storageBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storageBtnActive: { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
  storageText: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.textSecondary },
  storageTextActive: { color: colors.background, fontFamily: fontFamily.semiBold },
  bottomRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.primaryAccentDim,
  },
  editText: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.primaryAccent },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.dangerDim,
  },
  deleteText: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.danger },
});
