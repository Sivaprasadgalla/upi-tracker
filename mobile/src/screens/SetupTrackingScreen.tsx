import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/colors';
import { IOSSegmentedControl } from '../components/ios/IOSSegmentedControl';
import { Icon } from '../components/common/Icon';

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

  const themeOptions: ThemeMode[] = ['system', 'light', 'dark'];
  const themeLabels = ['System', 'Light', 'Dark'];
  const selectedThemeIndex = themeOptions.indexOf(themeMode);

  const handleThemeChange = async (index: number) => {
    const selectedMode = themeOptions[index];
    await setThemeMode(selectedMode);
  };

  const handleManualSync = async () => {
    Haptics.selectionAsync();
    setIsSyncing(true);
    try {
      await refreshData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Synchronized', 'Transactions and budget limits refreshed from backend database.');
    } catch {
      Alert.alert('Offline Mode', 'Could not connect to backend server. Operating with cached data.');
    } finally {
      setIsSyncing(false);
    }
  };

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
                {isBiometricSupported ? `${biometricLabel} Lock` : 'Device Security'}
              </Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                Require authentication whenever opening app
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={async (value) => {
                const success = await toggleBiometricLock(value);
                if (!success && value) {
                  Alert.alert(
                    'Verification Failed',
                    `Could not verify ${biometricLabel}. Ensure biometrics are enabled in device settings.`
                  );
                }
              }}
              trackColor={{ false: theme.separator, true: theme.success }}
              thumbColor="#FFFFFF"
            />
          </View>
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
  }
});
