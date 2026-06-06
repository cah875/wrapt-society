// Typography scale built on the Inter font (loaded via @expo-google-fonts/inter).
// Font family keys map to the names registered in App.tsx useFonts().

import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  largeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.textPrimary,
  } as TextStyle,
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
  } as TextStyle,
  heading: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  } as TextStyle,
  subheading: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  } as TextStyle,
  bodySecondary: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  } as TextStyle,
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,
  badge: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textPrimary,
  } as TextStyle,
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  } as TextStyle,
} as const;

// Shared card style used everywhere: radius 16 + subtle drop shadow.
export const cardStyle = {
  backgroundColor: colors.cardSurface,
  borderRadius: 16,
  padding: 16,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
};
