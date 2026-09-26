import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar
} from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppProvider, useApp } from './src/store/AppContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { BudgetLimitScreen } from './src/screens/BudgetLimitScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SetupTrackingScreen } from './src/screens/SetupTrackingScreen';
import { BiometricLockScreen } from './src/components/common/BiometricLockScreen';
import { Icon, IconName } from './src/components/common/Icon';

interface TabItem {
  id: 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'setup';
  label: string;
  iconName: IconName;
  badge?: number;
}

const MainNavigator: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount, isAppLocked, unlockApp } = useApp();
  const { theme } = useTheme();
  const isIOS = Platform.OS === 'ios';

  // Render Biometric Screen if app is locked
  if (isAppLocked) {
    return <BiometricLockScreen onUnlock={unlockApp} />;
  }

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Overview', iconName: 'overview' },
    { id: 'transactions', label: 'History', iconName: 'history' },
    { id: 'budgets', label: 'Limits', iconName: 'limits', badge: unreadCount },
    { id: 'analytics', label: 'Analytics', iconName: 'analytics' },
    { id: 'setup', label: 'Settings', iconName: 'setup' }
  ];

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'transactions':
        return <TransactionsScreen />;
      case 'budgets':
        return <BudgetLimitScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'setup':
        return <SetupTrackingScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* Screen Body */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Cupertino Native Tab Bar (iOS) vs Material Navigation Bar (Android) */}
      <View
        style={[
          styles.bottomNavContainer,
          isIOS ? styles.iosTabBar : styles.androidTabBar,
          {
            backgroundColor: theme.tabBarBg,
            borderTopColor: theme.tabBarBorder
          }
        ]}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const iconColor = isActive ? theme.primary : theme.textSecondary;

          return (
            <TouchableOpacity
              key={t.id}
              style={styles.navItem}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  name={t.iconName}
                  size={24}
                  color={iconColor}
                  focused={isActive}
                />
                {t.badge !== undefined && t.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                    <Text style={styles.badgeText}>{t.badge}</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.navLabel,
                  { color: iconColor },
                  isActive && styles.activeNavLabel
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainNavigator />
      </AppProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1
  },
  screenContainer: {
    flex: 1
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  iosTabBar: {
    height: 85, // Standard Apple UITabBar height with home indicator
    paddingBottom: 25,
    paddingTop: 8,
    borderTopWidth: 0.5
  },
  androidTabBar: {
    height: 70,
    paddingBottom: 10,
    borderTopWidth: 0.5
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: -0.2
  },
  activeNavLabel: {
    fontWeight: '600'
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -10,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  }
});
