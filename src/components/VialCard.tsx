// Inventory card for a single vial. Shows peptide name + size, status badge,
// expiry badge, remaining volume (reconstituted) and a storage-location icon.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VialRecord, StorageLocation } from '../types';
import ExpiryBadge from './ExpiryBadge';
import { colors } from '../theme/colors';
import { fontFamily, cardStyle } from '../theme/typography';

interface Props {
  vial: VialRecord;
  onPress: () => void;
}

const STORAGE_META: Record<
  StorageLocation,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }
> = {
  freezer: { icon: 'snowflake', label: 'Freezer' },
  fridge: { icon: 'fridge-outline', label: 'Fridge' },
  room_temp: { icon: 'thermometer', label: 'Room temp' },
};

export default function VialCard({ vial, onPress }: Props) {
  const isRecon = vial.status === 'reconstituted';
  const storage = STORAGE_META[vial.storageLocation];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {vial.peptideName}
        </Text>
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

      <Text style={styles.size}>{vial.vialSizeMg} mg vial</Text>

      <View style={styles.footerRow}>
        <ExpiryBadge vial={vial} />

        <View style={styles.rightMeta}>
          {isRecon && vial.remainingVolumeMl != null && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="water-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>
                {vial.remainingVolumeMl.toFixed(2)} mL
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={storage.icon}
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>{storage.label}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    marginBottom: 12,
  },
  pressed: { opacity: 0.85 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
  },
  size: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
