import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppProvider, useApp } from './src/store/AppContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { BudgetLimitScreen } from './src/screens/BudgetLimitScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SetupTrackingScreen } from './src/screens/SetupTrackingScreen';
import { BiometricLockScreen } from './src/components/common/BiometricLockScreen';
import { AppSplashScreen } from './src/components/common/AppSplashScreen';
import { SyncStatusBanner } from './src/components/common/SyncStatusBanner';
import { Icon, IconName } from './src/components/common/Icon';
import { MobileShell } from './src/components/web/MobileShell';

interface TabItem {
  id: 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'setup';
  label: string;
  iconName: IconName;
  badge?: number;
}

const TAB_KEYS = ['dashboard', 'transactions', 'budgets', 'analytics', 'setup'];

// Native Screen Transition Container with Direction-Aware Fluid Spring Slide
const ScreenTransitionWrapper: React.FC<{ activeKey: string; children: React.ReactNode }> = ({
  activeKey,
  children
}) => {
  const prevKeyRef = useRef<string>(activeKey);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey !== activeKey) {
      const prevIdx = TAB_KEYS.indexOf(prevKey);
      const nextIdx = TAB_KEYS.indexOf(activeKey);
      const isForward = nextIdx >= prevIdx;
      prevKeyRef.current = activeKey;

      const initialOffset = isForward ? 24 : -24;
      translateXAnim.setValue(initialOffset);
      fadeAnim.setValue(0.35);
      scaleAnim.setValue(0.985);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.spring(translateXAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 85,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [activeKey]);

  return (
    <Animated.View
      style={[
        styles.screenTransitionContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: translateXAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Animated Tab Bar Button with spring press effect and micro-bounce
const AnimatedTabButton: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  primaryColor: string;
  inactiveColor: string;
  dangerColor: string;
}> = ({ tab, isActive, onPress, primaryColor, inactiveColor, dangerColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -3,
          duration: 90,
          useNativeDriver: true
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 4,
          tension: 100,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isActive]);

  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 70,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true
      })
    ]).start();

    onPress();
  };

  const iconColor = isActive ? primaryColor : inactiveColor;

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim }
            ]
          }
        ]}
      >
        <Icon
          name={tab.iconName}
          size={24}
          color={iconColor}
          focused={isActive}
        />
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: dangerColor }]}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
        )}
      </Animated.View>

      <Text
        style={[
          styles.navLabel,
          { color: iconColor },
          isActive && styles.activeNavLabel
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

const MainNavigator: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount, isAppLocked, unlockApp, isInitializing } = useApp();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  // 1. Render Opening Splash Loader while initializing
  if (isInitializing) {
    return <AppSplashScreen />;
  }

  // 2. Render Biometric / Passcode Lock Screen if app is locked
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

  // Dynamic insets calculations for genuine native iOS and Android edge-to-edge
  const bottomPadding = isIOS
    ? Math.max(insets.bottom, 20)
    : Math.max(insets.bottom, 10);
  const navHeight = isIOS ? 58 + bottomPadding : 64 + bottomPadding;

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
        translucent={Platform.OS === 'android'}
      />

      {/* Floating Cloud Sync Loader */}
      <SyncStatusBanner />

      {/* Screen Body with Native Transition */}
      <View style={[styles.screenContainer, { paddingBottom: navHeight }]}>
        <ScreenTransitionWrapper activeKey={activeTab}>
          {renderActiveScreen()}
        </ScreenTransitionWrapper>
      </View>

      {/* Cupertino Native Tab Bar (iOS) vs Material 3 Navigation Bar (Android) */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            height: navHeight,
            paddingBottom: bottomPadding,
            backgroundColor: theme.tabBarBg,
            borderTopColor: theme.tabBarBorder
          }
        ]}
      >
        {tabs.map((t) => (
          <AnimatedTabButton
            key={t.id}
            tab={t}
            isActive={activeTab === t.id}
            onPress={() => setActiveTab(t.id)}
            primaryColor={theme.primary}
            inactiveColor={theme.textSecondary}
            dangerColor={theme.danger}
          />
        ))}
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <MobileShell>
            <MainNavigator />
          </MobileShell>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1
  },
  screenContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 44 : 0
  },
  screenTransitionContainer: {
    flex: 1
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    zIndex: 100
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
