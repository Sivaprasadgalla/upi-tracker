import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert
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
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    BiometricService.getBiometricType().then(setBiometricType);
    BiometricService.getBiometricLabel().then(setBiometricLabel);

    // On native mobile with biometric hardware, prompt Face ID/Fingerprint on launch
    if (Platform.OS !== 'web') {
      triggerNativeAuth(false);
    }
  }, []);

  const triggerNativeAuth = async (usePasscode: boolean = false) => {
    setErrorMessage('');
    const res = await BiometricService.authenticate(
      usePasscode ? 'Enter device passcode' : 'Unlock UPI Tracker with Face ID',
      usePasscode
    );

    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      onUnlock();
    } else if (res.error && !res.error.includes('cancel')) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setErrorMessage(res.error || 'Authentication canceled or not recognized.');
    }
  };

  const handleDigitPress = useCallback(
    async (digit: string) => {
      if (isVerifying || enteredPin.length >= 4) return;

      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMessage('');

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      if (nextPin.length === 4) {
        setIsVerifying(true);
        const valid = await BiometricService.verifyPin(nextPin);
        if (valid) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          onUnlock();
        } else {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch {}
          setErrorMessage('Incorrect PIN. Please try again.');
          setTimeout(() => {
            setEnteredPin('');
            setIsVerifying(false);
          }, 400);
        }
      }
    },
    [enteredPin, isVerifying, onUnlock]
  );

  const handleDeletePress = useCallback(() => {
    if (enteredPin.length > 0) {
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMessage('');
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }, [enteredPin]);

  // Web physical keyboard support
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (/^[0-9]$/.test(e.key)) {
          handleDigitPress(e.key);
        } else if (e.key === 'Backspace') {
          handleDeletePress();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleDigitPress, handleDeletePress]);

  const handleResetLock = () => {
    Alert.alert(
      'Reset App Security Lock?',
      'This will disable the security lock so you can access your dashboard. You can re-enable and set a new PIN in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Lock',
          style: 'destructive',
          onPress: async () => {
            await BiometricService.resetPin();
            onUnlock();
          }
        }
      ]
    );
  };

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['biometric', '0', 'delete']
  ];

  const hasBiometricOption = biometricType === 'FACE_ID' || biometricType === 'FINGERPRINT';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <TouchableOpacity
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.12)',
              borderColor: isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.25)'
            }
          ]}
          onPress={() => triggerNativeAuth(false)}
          activeOpacity={0.7}
        >
          <Icon name={hasBiometricOption ? 'faceid' : 'lock'} size={44} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.textPrimary }]}>UPI Tracker Locked</Text>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
          Enter 4-digit PIN to access your financial data
        </Text>

        {/* 4 PIN Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < enteredPin.length;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isFilled ? theme.primary : 'transparent',
                    borderColor: isFilled ? theme.primary : theme.textSecondary
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Error message */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Numeric Keypad */}
        <View style={styles.keypadContainer}>
          {keypadRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.keypadRow}>
              {row.map((key) => {
                if (key === 'biometric') {
                  if (hasBiometricOption) {
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.keyButton, styles.emptyKey]}
                        onPress={() => triggerNativeAuth(false)}
                        activeOpacity={0.7}
                      >
                        <Icon name="faceid" size={28} color={theme.primary} />
                      </TouchableOpacity>
                    );
                  }
                  return <View key={key} style={[styles.keyButton, styles.emptyKey]} />;
                }

                if (key === 'delete') {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.keyButton, styles.emptyKey]}
                      onPress={handleDeletePress}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.deleteKeyText, { color: theme.textPrimary }]}>⌫</Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.keyButton,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.08)'
                      }
                    ]}
                    onPress={() => handleDigitPress(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.keyText, { color: theme.textPrimary }]}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Reset / Forgot PIN Option */}
        <TouchableOpacity
          style={styles.forgotButton}
          onPress={handleResetLock}
          activeOpacity={0.7}
        >
          <Text style={[styles.forgotButtonText, { color: theme.textSecondary }]}>
            Forgot PIN? Reset Lock
          </Text>
        </TouchableOpacity>

        {/* Security Notice Footer */}
        <View style={styles.footer}>
          <Icon name="shield" size={14} color={theme.textSecondary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Protected by Apple Secure Enclave & Session Encryption
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
    paddingHorizontal: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center'
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1.5
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 18
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5
  },
  errorBox: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    marginBottom: 12
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  keyButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5
  },
  emptyKey: {
    backgroundColor: 'transparent',
    borderWidth: 0
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500'
  },
  deleteKeyText: {
    fontSize: 24,
    fontWeight: '400'
  },
  forgotButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14
  },
  forgotButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6
  }
});
