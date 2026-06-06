// Full-screen, non-dismissable Research-Use-Only gate shown on first launch.

import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  onAccept: () => void;
}

const BODY =
  'PeptideVault is for research and informational purposes only. The information in this app does not constitute medical advice. All peptides listed are Research Use Only compounds. Consult a licensed healthcare professional before use.';

export default function DisclaimerModal({ visible, onAccept }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      // Backdrop cannot dismiss; back button is a no-op.
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="flask-outline"
            size={48}
            color={colors.primaryAccent}
          />
        </View>

        <Text style={styles.title}>Research Use Only</Text>

        <Text style={styles.body}>{BODY}</Text>

        <View style={styles.spacer} />

        <Pressable
          onPress={onAccept}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>I Understand — Continue</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
    paddingVertical: 60,
    justifyContent: 'center',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryAccentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
  button: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.background,
  },
});
