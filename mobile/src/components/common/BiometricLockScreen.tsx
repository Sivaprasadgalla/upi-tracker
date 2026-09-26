import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BiometricService, BiometricType } from '../../services/biometricService';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from './Icon';

interface Props {
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const { theme, isDark } = useTheme();
  const [biometricType, setBiometricType] = useState<BiometricType>('NONE');
  const [biometricLabel, setBiometricLabel] = useState<string>('Face ID');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    BiometricService.getBiometricType().then(setBiometricType);
    BiometricService.getBiometricLabel().then(setBiometricLabel);

    // Auto-prompt Face ID on display
    triggerAuth(false);
  }, []);

  const triggerAuth = async (usePasscode: boolean = false) => {
    setErrorMessage('');
    const res = await BiometricService.authenticate(
      usePasscode ? 'Enter device passcode' : 'Unlock UPI Tracker with Face ID',
      usePasscode
    );

    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(res.error || 'Authentication canceled or not recognized.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Face ID Icon with System Blue Halo */}
        <TouchableOpacity
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.12)',
              borderColor: isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.25)'
            }
          ]}
          onPress={() => triggerAuth(false)}
          activeOpacity={0.7}
        >
          <Icon name="faceid" size={52} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.textPrimary }]}>UPI Tracker Locked</Text>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
          Your financial transactions and limits are protected by {biometricLabel}.
        </Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Text style={[styles.errorHint, { color: theme.textSecondary }]}>
              Tip: If Face ID doesn't show, ensure "Face ID" is toggled ON in iPhone Settings → Expo Go.
            </Text>
          </View>
        ) : null}

        {/* Primary Face ID Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: theme.primary }]}
          onPress={() => triggerAuth(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.unlockButtonText}>
            {biometricType === 'FACE_ID' ? 'Unlock with Face ID' : `Unlock with ${biometricLabel}`}
          </Text>
        </TouchableOpacity>

        {/* Fallback to Device Passcode Button */}
        <TouchableOpacity
          style={styles.passcodeButton}
          onPress={() => triggerAuth(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.passcodeButtonText, { color: theme.primary }]}>Use Device Passcode</Text>
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.footer}>
          <Icon name="shield" size={15} color={theme.textSecondary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Protected by Apple Secure Enclave
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    borderWidth: 1.5
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
    paddingHorizontal: 16
  },
  errorBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    marginBottom: 20,
    width: '100%',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 69, 58, 0.3)'
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4
  },
  errorHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16
  },
  unlockButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600'
  },
  passcodeButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 28
  },
  passcodeButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6
  }
});
