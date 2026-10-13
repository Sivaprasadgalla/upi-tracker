import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar
} from 'react-native';
import { AppLogo } from './AppLogo';
import { useTheme } from '../../theme/ThemeContext';

export const AppSplashScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in text & spinner
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();

    // Gentle logo breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B0F19' : '#0B0F19' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={styles.contentCenter}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <AppLogo size={96} showGlow={true} />
        </Animated.View>

        <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
          <Text style={styles.appName}>UPI Tracker</Text>
          <View style={styles.taglineBadge}>
            <Text style={styles.taglineText}>FINANCIAL INTELLIGENCE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>Opening secure vault...</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🔒 Bank-Grade Local Encryption</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56
  },
  contentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 36
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  taglineBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1.2
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 10
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '500'
  }
});

