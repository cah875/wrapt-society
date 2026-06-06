// Shared screen scaffold: dark background + molecular texture + safe-area
// padding. Wrap every screen in this for a consistent look.

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HexBackground from './HexBackground';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  /** Disable top safe-area inset (e.g. when inside a stack header). */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
}

export default function Screen({
  children,
  edges = ['top', 'left', 'right'],
  style,
}: Props) {
  return (
    <View style={styles.root}>
      <HexBackground />
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
});
