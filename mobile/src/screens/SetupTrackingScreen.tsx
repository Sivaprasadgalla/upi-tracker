import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/colors';
import { IOSSegmentedControl } from '../components/ios/IOSSegmentedControl';
import { Icon } from '../components/common/Icon';
import { BiometricService } from '../services/biometricService';

export const SetupTrackingScreen: React.FC = () => {
  const {
    isBiometricSupported,
    isBiometricEnabled,
    biometricLabel,
    toggleBiometricLock,
    syncStatus,
    refreshData
  } = useApp();

  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);

  // PIN Setup Modal States
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinMode, setPinMode] = useState<'setup' | 'change'>('setup');
  const [pinStep, setPinStep] = useState<1 | 2>(1);
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const themeOptions: ThemeMode[] = ['system', 'light', 'dark'];
  const themeLabels = ['System', 'Light', 'Dark'];
  const selectedThemeIndex = themeOptions.indexOf(themeMode);

  const handleThemeChange = async (index: number) => {
    const selectedMode = themeOptions[index];
    await setThemeMode(selectedMode);
  };

  const handleManualSync = async () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setIsSyncing(true);
    try {
      await refreshData();
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('Synchronized', 'Transactions and budget limits refreshed from backend database.');
    } catch {
      Alert.alert('Offline Mode', 'Could not connect to backend server. Operating with cached data.');
    } finally {
      setIsSyncing(false);
    }
  };

  const openPinModal = (mode: 'setup' | 'change') => {
    setPinMode(mode);
    setPinStep(1);
    setEnteredPin('');
    setConfirmPin('');
    setPinError('');
    setPinModalVisible(true);
  };

  const closePinModal = () => {
    setPinModalVisible(false);
    setEnteredPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handlePinDigit = async (digit: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (pinStep === 1) {
      if (enteredPin.length >= 4) return;
      const next = enteredPin + digit;
      setEnteredPin(next);
      setPinError('');
      if (next.length === 4) {
        setTimeout(() => setPinStep(2), 200);
      }
    } else {
      if (confirmPin.length >= 4) return;
      const next = confirmPin + digit;
      setConfirmPin(next);
      setPinError('');
      if (next.length === 4) {
        if (next === enteredPin) {
          await BiometricService.setPin(enteredPin);
          await toggleBiometricLock(true);
          closePinModal();
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          Alert.alert('PIN Configured', 'App security lock is now active with your 4-digit PIN.');
        } else {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch {}
          setPinError('PINs do not match. Please try again.');
          setTimeout(() => setConfirmPin(''), 500);
        }
      }
    }
  };

  const handlePinDelete = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (pinStep === 1) {
      setEnteredPin((prev) => prev.slice(0, -1));
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin((prev) => prev.slice(0, -1));
      } else {
        setPinStep(1);
      }
    }
  };

  useEffect(() => {
    if (pinModalVisible && Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (/^[0-9]$/.test(e.key)) {
          handlePinDigit(e.key);
        } else if (e.key === 'Backspace') {
          handlePinDelete();
        } else if (e.key === 'Escape') {
          closePinModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [pinModalVisible, pinStep, enteredPin, confirmPin]);

  const shortcutSteps = [
    {
      step: '1',
      title: 'Open Apple Shortcuts App',
      desc: 'Go to the Automation tab at the bottom and tap "+" to create a Personal Automation.'
    },
    {
      step: '2',
      title: 'Trigger: "Message" or "Transaction"',
      desc: 'Select "Message" contains words like "UPI", "debited", "paid", or "credited". Set to "Run Immediately".'
    },
    {
      step: '3',
      title: 'Action: Open URL in UPI Tracker',
      desc: 'Add the action "Open URL" and set the URL to: upitracker://log?text=ShortcutInput'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Title Header */}
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>
            Settings
          </Text>
        </View>

        {/* Section 1: Appearance & Theme */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          APPEARANCE & THEME
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.themeSelectorContainer}>
            <IOSSegmentedControl
              values={themeLabels}
              selectedIndex={selectedThemeIndex}
              onChange={handleThemeChange}
            />
          </View>
          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
          <View style={styles.tableRow}>
            <View style={[styles.iconSquircle, { backgroundColor: theme.primaryLight }]}>
              <Icon name="overview" size={20} color={theme.primary} />
            </View>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                {themeMode === 'system'
                  ? `System (${isDark ? 'Dark Mode' : 'Light Mode'})`
                  : themeMode === 'light'
                  ? 'Cupertino Light'
                  : 'OLED Pure Black'}
              </Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                {themeMode === 'system'
                  ? 'Automatically adapts to device appearance settings'
                  : 'Custom manual color scheme active'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Backend Live Status */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
          BACKEND DATABASE SYNC
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.tableRow}>
            <View
              style={[
                styles.iconSquircle,
                {
                  backgroundColor:
                    syncStatus === 'connected'
                      ? theme.successLight
                      : syncStatus === 'syncing'
                      ? theme.primaryLight
                      : theme.dangerLight
                }
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      syncStatus === 'connected'
                        ? theme.success
                        : syncStatus === 'syncing'
                        ? theme.primary
                        : theme.danger
                  }
                ]}
              />
            </View>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                {syncStatus === 'connected'
                  ? 'Connected & Synchronized'
                  : syncStatus === 'syncing'
                  ? 'Synchronizing Database...'
                  : 'Offline (Local Cache Active)'}
              </Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                MongoDB Atlas • Live Node.js REST API
              </Text>
            </View>
          </View>

          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

          <TouchableOpacity
            style={styles.syncButtonRow}
            onPress={handleManualSync}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Icon name="refresh" size={18} color={theme.primary} />
            )}
            <Text style={[styles.syncButtonText, { color: theme.primary }]}>
              {isSyncing ? 'Fetching Latest Data...' : 'Sync Database Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Security & Biometrics */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
          SECURITY & PRIVACY
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.tableRow}>
            <View style={[styles.iconSquircle, { backgroundColor: theme.primaryLight }]}>
              <Icon name="faceid" size={22} color={theme.primary} />
            </View>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                {isBiometricSupported ? `${biometricLabel}` : 'Device Security & PIN'}
              </Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                Require authentication / PIN whenever opening app
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={async (value) => {
                if (value) {
                  if (Platform.OS === 'web') {
                    const hasPin = await BiometricService.hasPin();
                    if (!hasPin) {
                      openPinModal('setup');
                      return;
                    }
                  }
                  const success = await toggleBiometricLock(true);
                  if (!success) {
                    Alert.alert(
                      'Verification Failed',
                      `Could not verify ${biometricLabel}. Ensure biometrics or security settings are enabled.`
                    );
                  }
                } else {
                  await toggleBiometricLock(false);
                }
              }}
              trackColor={{ false: theme.separator, true: theme.success }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isBiometricEnabled && (
            <>
              <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
              <TouchableOpacity
                style={styles.tableRow}
                onPress={() => openPinModal('change')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: theme.primaryLight }]}>
                  <Icon name="lock" size={20} color={theme.primary} />
                </View>
                <View style={styles.rowLabelContainer}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                    Change Security PIN
                  </Text>
                  <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                    Update your 4-digit security code
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Section 4: Apple Shortcuts Guide */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
          AUTOMATED TRACKING SETUP
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.infoBanner, { backgroundColor: theme.fill, borderBottomColor: theme.separator }]}>
            <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
              iOS isolates third-party apps from reading notifications directly. Use Apple’s native Shortcuts Automations to capture bank SMS and UPI alerts seamlessly.
            </Text>
          </View>

          {shortcutSteps.map((step, idx) => (
            <View key={step.step}>
              <View style={styles.stepRow}>
                <View style={[styles.stepBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.primary }]}>{step.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>{step.title}</Text>
                  <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
                </View>
              </View>
              {idx < shortcutSteps.length - 1 && (
                <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 4-Digit Security PIN Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePinModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={[styles.modalIconSquircle, { backgroundColor: theme.primaryLight }]}>
              <Icon name="lock" size={26} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {pinStep === 1
                ? (pinMode === 'change' ? 'Enter New 4-Digit PIN' : 'Create 4-Digit PIN')
                : 'Confirm Your PIN'}
            </Text>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {pinStep === 1
                ? 'Choose 4 digits to protect your financial records'
                : 'Re-enter your 4 digits to confirm'}
            </Text>

            {/* 4 PIN Dots */}
            <View style={styles.modalDotsRow}>
              {[0, 1, 2, 3].map((index) => {
                const currentVal = pinStep === 1 ? enteredPin : confirmPin;
                const isFilled = index < currentVal.length;
                return (
                  <View
                    key={index}
                    style={[
                      styles.modalDot,
                      {
                        backgroundColor: isFilled ? theme.primary : 'transparent',
                        borderColor: isFilled ? theme.primary : theme.textSecondary
                      }
                    ]}
                  />
                );
              })}
            </View>

            {/* Error Message */}
            {pinError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{pinError}</Text>
              </View>
            ) : null}

            {/* Keypad */}
            <View style={styles.modalKeypad}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['', '0', 'delete']
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.modalKeypadRow}>
                  {row.map((k, kIdx) => {
                    if (k === '') {
                      return <View key={kIdx} style={styles.modalKeyEmpty} />;
                    }
                    if (k === 'delete') {
                      return (
                        <TouchableOpacity
                          key={kIdx}
                          style={styles.modalKeyEmpty}
                          onPress={handlePinDelete}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.modalDeleteText, { color: theme.textPrimary }]}>⌫</Text>
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={kIdx}
                        style={[
                          styles.modalKeyButton,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                            borderColor: theme.separator
                          }
                        ]}
                        onPress={() => handlePinDigit(k)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.modalKeyText, { color: theme.textPrimary }]}>{k}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={closePinModal}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 110
  },
  header: {
    marginBottom: 20
  },
  largeTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.38
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4
  },
  insetGroupCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden'
  },
  themeSelectorContainer: {
    padding: 14
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  iconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  rowLabelContainer: {
    flex: 1
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '600'
  },
  rowSubLabel: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 17
  },
  syncButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  infoBanner: {
    padding: 16,
    borderBottomWidth: 0.5
  },
  infoBannerText: {
    fontSize: 14,
    lineHeight: 20
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2
  },
  stepBadgeText: {
    fontSize: 15,
    fontWeight: '700'
  },
  stepContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 19
  },
  hairline: {
    height: 0.5,
    marginLeft: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 0.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  modalIconSquircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10
  },
  modalDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 16
  },
  modalDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5
  },
  modalErrorBox: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    marginBottom: 12
  },
  modalErrorText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  modalKeypad: {
    width: '100%',
    maxWidth: 240,
    marginBottom: 8
  },
  modalKeypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  modalKeyButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5
  },
  modalKeyEmpty: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalKeyText: {
    fontSize: 22,
    fontWeight: '500'
  },
  modalDeleteText: {
    fontSize: 20,
    fontWeight: '400'
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 20
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600'
  }
});
