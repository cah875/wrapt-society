// Cross-platform date (or date+time) field built on the community picker.
// Tapping opens the native picker; the chosen value is shown in the field.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

interface Props {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  mode?: 'date' | 'datetime';
  maximumDate?: Date;
}

function format(d: Date, withTime: boolean): string {
  const date = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

export default function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  maximumDate,
}: Props) {
  const [show, setShow] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const withTime = mode === 'datetime';

  const open = () => {
    setPickerMode('date');
    setShow(true);
  };

  const handleChange = (event: any, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setShow(false);
      return;
    }
    if (Platform.OS === 'android') {
      if (withTime && pickerMode === 'date') {
        // Chain into the time picker after the date is picked.
        onChange(
          new Date(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
            value.getHours(),
            value.getMinutes(),
          ),
        );
        setPickerMode('time');
        return; // keep picker open for time step
      }
      setShow(false);
    }
    onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={open}>
        <MaterialCommunityIcons
          name="calendar-outline"
          size={18}
          color={colors.primaryAccent}
        />
        <Text style={styles.value}>{format(value, withTime)}</Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={value}
          mode={Platform.OS === 'android' ? pickerMode : (mode as any)}
          display="default"
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 7,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  value: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
