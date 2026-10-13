import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BiometricService } from '../../services/biometricService';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from './Icon';
import { AppLogo } from './AppLogo';

interface Props {
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const { theme, isDark } = useTheme();
  const [biometricLabel, setBiometricLabel] = useState<string>('Face ID');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const isPromptingRef = useRef<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const triggerNativeAuth = useCallback(async () => {
    if (isPromptingRef.current) return;
    if (Platform.OS === 'web') {
      onUnlock();
      return;
    }

    isPromptingRef.current = true;
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const res = await BiometricService.authenticate('Unlock UPI Tracker');

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        onUnlock();
      } else {
        if (res.errorCode === 'user_cancel' || res.errorCode === 'system_cancel' || res.errorCode === 'app_cancel') {
          setErrorMessage('Authentication canceled. Tap below to unlock.');
        } else {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch {}
          setErrorMessage(res.error || 'Authentication failed. Tap below to retry.');
        }
      }
    } finally {
      setIsAuthenticating(false);
      setTimeout(() => {
        isPromptingRef.current = false;
      }, 400);
    }
  }, [onUnlock]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    BiometricService.getBiometricLabel().then(setBiometricLabel);

    // Prompt native Face ID / Passcode sheet immediately on mount
    const timer = setTimeout(() => {
      triggerNativeAuth();
    }, 250);

    // Re-prompt when app returns from background
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        triggerNativeAuth();
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [triggerNativeAuth]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* App Logo & Lock Indicator */}
        <TouchableOpacity
          style={styles.logoBadgeContainer}
          onPress={triggerNativeAuth}
          activeOpacity={0.8}
        >
          <AppLogo size={88} showGlow={true} />
          <View
            style={[
              styles.miniLockBadge,
              {
                backgroundColor: theme.primary,
                borderColor: theme.background
              }
            ]}
          >
            <Icon name="faceid" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.textPrimary }]}>UPI Tracker Locked</Text>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
          Authentication required with {biometricLabel} or your device passcode
        </Text>

        {/* Status / Error Message */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: theme.primary }]}
          onPress={triggerNativeAuth}
          disabled={isAuthenticating}
          activeOpacity={0.8}
        >
          <Icon name="faceid" size={22} color="#FFFFFF" />
          <Text style={styles.unlockButtonText}>
            {isAuthenticating ? 'Authenticating...' : `Unlock with ${biometricLabel} / Passcode`}
          </Text>
        </TouchableOpacity>

        {/* Security Footer Notice */}
        <View style={styles.footer}>
          <Icon name="shield" size={14} color={theme.textSecondary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Protected by Apple Secure Enclave & Device Passcode
          </Text>
        </View>
      </Animated.View>
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
    paddingHorizontal: 28,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center'
  },
  logoBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28
  },
  miniLockBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16
  },
  errorBox: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    marginBottom: 20,
    maxWidth: 320
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6
  }
});
