import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/colors';
import { IOSSegmentedControl } from '../components/ios/IOSSegmentedControl';
import { Icon } from '../components/common/Icon';
import { BiometricService } from '../services/biometricService';
import { AndroidListenerBridge } from '../services/androidListenerBridge';

export const SetupTrackingScreen: React.FC = () => {
  const {
    isBiometricSupported,
    isBiometricEnabled,
    biometricLabel,
    toggleBiometricLock,
    syncStatus,
    refreshData,
    userToken,
    currentDeviceId,
    switchAccount
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

  const isIOSUser =
    Platform.OS === 'ios' ||
    (Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1)));

  const activeToken =
    userToken ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhY2QxZTlmMzdmZDY4OTQ5YzJmZDZjMSIsImVtYWlsIjoiZGV2aWNlX2lvc19kZXZpY2VfdGVzdEB1cGl0cmFja2VyLmxvY2FsIiwiaWF0IjoxNzkxODI3NjE2LCJleHAiOjE3OTQ0MTk2MTZ9.8N1BAsioQE4VUsimWl7a4aId7OvOYNxi9ivwkEMyJj4';

  const shortcutSteps = [
    {
      step: '1',
      title: 'Open Apple Shortcuts App',
      desc: 'Go to the Automation tab at bottom > tap "+" > choose "New Automation" / "Personal Automation".'
    },
    {
      step: '2',
      title: 'Trigger: Message Contains',
      desc: 'Choose "Message" > Message contains: "debited" (or "paid", "UPI"). Choose "Run Immediately" & turn off "Notify When Run".'
    },
    {
      step: '3',
      title: 'Action: "Get Contents of URL"',
      desc: 'Add action "Get Contents of URL". Set Method to POST and URL to the Ingest Webhook URL below.'
    },
    {
      step: '4',
      title: 'Headers (Resolves 401 Error)',
      desc: 'Add 2 Headers:\n• Content-Type: application/json\n• Authorization: Bearer <Token below>'
    },
    {
      step: '5',
      title: 'Request Body: JSON',
      desc: 'Set Request Body to JSON with 2 fields:\n• source: IOS_SHORTCUT (Text)\n• rawText: Shortcut Input (Text variable)'
    }
  ];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await refreshData();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
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
                {biometricLabel} & Passcode Lock
              </Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                Require Face ID or device passcode to open app
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={async (value) => {
                const success = await toggleBiometricLock(value);
                if (!success && value) {
                  Alert.alert(
                    'Security Lock',
                    'Authentication canceled. Face ID & Passcode lock was not enabled.'
                  );
                }
              }}
              trackColor={{ false: theme.separator, true: theme.success }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Informative Troubleshooting Callout */}
        <View style={[styles.infoBanner, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginTop: 10, borderRadius: 12 }]}>
          <Text style={[styles.infoBannerText, { color: theme.textSecondary, fontSize: 12 }]}>
            💡 <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Native Face ID & Passcode:</Text> Uses your iPhone's native Face ID with automatic device passcode fallback. If Face ID is not scanning, check <Text style={{ fontWeight: '600', color: theme.primary }}>iPhone Settings &gt; Expo Go &gt; Face ID</Text> to ensure permission is ON.
          </Text>
        </View>

        {/* Section 4: Apple Shortcuts Guide (Displayed only to iOS users) */}
        {isIOSUser && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
              AUTOMATED TRACKING SETUP (APPLE SHORTCUTS)
            </Text>
            <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={[styles.infoBanner, { backgroundColor: theme.fill, borderBottomColor: theme.separator }]}>
                <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
                  iOS isolates apps from reading SMS directly. Apple Shortcuts automations forward bank SMS alerts seamlessly to your cloud database in real-time.
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

            {/* Section 5: Webhook Credentials Card */}
            <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
              SHORTCUT WEBHOOK CREDENTIALS
            </Text>
            <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, padding: 16 }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>
                1. Webhook URL (POST)
              </Text>
              <View style={{ backgroundColor: theme.fill, padding: 12, borderRadius: 10, marginBottom: 16 }}>
                <Text selectable={true} style={{ fontSize: 13, color: theme.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  https://upi-tracker-r7mk.onrender.com/api/transactions/ingest
                </Text>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>
                2. Authorization Header Value
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 6 }}>
                Tap and hold below to select &amp; copy this token into your Shortcut Headers:
              </Text>
              <View style={{ backgroundColor: theme.fill, padding: 12, borderRadius: 10, marginBottom: 16 }}>
                <Text selectable={true} style={{ fontSize: 11, color: theme.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 16 }}>
                  {`Bearer ${activeToken}`}
                </Text>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>
                3. JSON Request Body Fields
              </Text>
              <View style={{ backgroundColor: theme.fill, padding: 12, borderRadius: 10 }}>
                <Text style={{ fontSize: 13, color: theme.textPrimary, marginBottom: 4 }}>
                  • <Text style={{ fontWeight: '700' }}>source</Text> : Text = <Text style={{ color: theme.primary, fontWeight: '600' }}>IOS_SHORTCUT</Text>
                </Text>
                <Text style={{ fontSize: 13, color: theme.textPrimary }}>
                  • <Text style={{ fontWeight: '700' }}>rawText</Text> : Text = <Text style={{ color: theme.primary, fontWeight: '600' }}>Shortcut Input</Text>
                </Text>
              </View>
            </View>

            {/* Section 6: How to Duplicate Tip Card */}
            <View style={[styles.infoBanner, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginTop: 14, borderRadius: 12, borderWidth: 0.5 }]}>
              <Text style={[styles.infoBannerText, { color: theme.textSecondary, fontSize: 13, lineHeight: 19 }]}>
                💡 <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Pro-Tip: Multiple Keywords (debited, paid, UPI)</Text>{'\n'}
                Instead of rewriting the Webhook URL and Token for every keyword, create <Text style={{ fontWeight: '600', color: theme.primary }}>ONE</Text> Shortcut named "Log UPI SMS" containing the URL action. Then under Automations, create separate triggers for "debited", "paid", and "UPI" that all simply select <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Run "Log UPI SMS"</Text>!
              </Text>
            </View>
          </>
        )}

        {/* Section 4 (Android): Native Android Notification Listener */}
        {!isIOSUser && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
              AUTOMATED TRACKING (ANDROID)
            </Text>
            <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={[styles.infoBanner, { backgroundColor: theme.fill, borderBottomColor: theme.separator }]}>
                <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
                  Android automatically captures incoming transactions directly from Google Pay, PhonePe, Paytm, CRED, and Bank SMS in the background. No Apple Shortcuts setup required!
                </Text>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.iconSquircle, { backgroundColor: theme.successLight }]}>
                  <Icon name="check" size={20} color={theme.success} />
                </View>
                <View style={styles.rowLabelContainer}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Background Notification Listener</Text>
                  <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
                    Captures UPI app alerts &amp; SMS in real-time
                  </Text>
                </View>
              </View>

              <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

              <TouchableOpacity
                style={styles.syncButtonRow}
                onPress={() => AndroidListenerBridge.openPermissionSettings()}
                activeOpacity={0.7}
              >
                <Icon name="setup" size={18} color={theme.primary} />
                <Text style={[styles.syncButtonText, { color: theme.primary }]}>
                  Open Notification Access Settings
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Section 7: Account & Friends Multi-User Cloud Sync */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>
          ACCOUNT &amp; MULTI-USER CLOUD SYNC
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, padding: 16 }]}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>
            Current Account / Sync ID
          </Text>
          <View style={{ backgroundColor: theme.fill, padding: 12, borderRadius: 10, marginBottom: 14 }}>
            <Text selectable={true} style={{ fontSize: 13, color: theme.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600' }}>
              {currentDeviceId || 'ios_device_test'}
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18, marginBottom: 14 }}>
            👥 <Text style={{ fontWeight: '600', color: theme.textPrimary }}>How it works with friends:</Text>{'\n'}
            • <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Complete Privacy:</Text> Each friend who installs this app gets their own private account and separate database in the cloud.{'\n'}
            • <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Friends on iPhone:</Text> Each friend copies their own unique token from their Settings screen into their Apple Shortcut.{'\n'}
            • <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Friends on Android:</Text> Payments are tracked automatically with zero shortcuts needed!{'\n'}
            • <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Shared / Joint Accounts:</Text> If two people want to share a joint household budget, enter the same Account ID on both devices.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.fill,
                paddingVertical: 11,
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: theme.cardBorder
              }}
              onPress={() => {
                Alert.alert(
                  'Create Fresh Private Account?',
                  'This device will disconnect from the current account and establish a brand-new private cloud database for your transactions.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Create New Account',
                      onPress: async () => {
                        const newId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
                        const ok = await switchAccount(newId);
                        if (ok) {
                          Alert.alert('Account Created', `Now using private account: ${newId}`);
                        }
                      }
                    }
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>New Private Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.fill,
                paddingVertical: 11,
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: theme.cardBorder
              }}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Alert.prompt(
                    'Join Shared Account',
                    'Enter the Account ID / Sync Code to share a joint expense tracker with another device:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Connect',
                        onPress: async (id?: string) => {
                          if (id && id.trim()) {
                            const ok = await switchAccount(id.trim());
                            if (ok) {
                              Alert.alert('Account Linked', `Successfully connected to: ${id.trim()}`);
                            }
                          }
                        }
                      }
                    ],
                    'plain-text',
                    currentDeviceId || ''
                  );
                } else {
                  Alert.alert(
                    'Shared Account Sync',
                    `Current Account ID: ${currentDeviceId || 'default'}\n\nTo share an account across multiple devices, connect to the same Account ID.`
                  );
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>Join / Switch Account</Text>
            </TouchableOpacity>
          </View>
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
