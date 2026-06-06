// Color-coded expiry pill. Green = ok, yellow = warning, red = EXPIRED.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VialRecord } from '../types';
import { getExpiryInfo } from '../utils/notificationUtils';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

interface Props {
  vial: VialRecord;
  large?: boolean;
}

export default function ExpiryBadge({ vial, large = false }: Props) {
  const info = getExpiryInfo(vial);

  let bg: string = colors.primaryAccentDim;
  let fg: string = colors.primaryAccent;
  let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'check-circle-outline';
  let label = 'Stable';

  if (!info) {
    bg = colors.border;
    fg = colors.textSecondary;
    icon = 'help-circle-outline';
    label = 'Unknown';
  } else if (info.status === 'expired') {
    bg = colors.dangerDim;
    fg = colors.danger;
    icon = 'alert-octagon-outline';
    label = 'EXPIRED';
  } else if (info.status === 'warning') {
    bg = colors.warningDim;
    fg = colors.warning;
    icon = 'clock-alert-outline';
    label = `${info.daysRemaining} days left`;
  } else {
    label = `${info.daysRemaining} days remaining`;
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        large && styles.badgeLarge,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={large ? 18 : 14} color={fg} />
      <Text style={[styles.label, { color: fg }, large && styles.labelLarge]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  badgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 7,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
  labelLarge: {
    fontSize: 14,
  },
});
