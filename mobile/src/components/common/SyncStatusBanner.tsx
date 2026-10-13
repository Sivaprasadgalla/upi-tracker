import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../store/AppContext';
import { useTheme } from '../../theme/ThemeContext';

export const SyncStatusBanner: React.FC = () => {
  const { syncStatus } = useApp();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (syncStatus === 'syncing') {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: insets.top + (Platform.OS === 'web' ? 12 : 8),
          friction: 8,
          tension: 60,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [syncStatus, insets.top]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.94)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.3)',
            shadowColor: '#000000'
          }
        ]}
      >
        <ActivityIndicator size="small" color={theme.primary} style={styles.spinner} />
        <Text style={[styles.text, { color: theme.textPrimary }]}>Syncing data with cloud...</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6
  },
  spinner: {
    marginRight: 8,
    transform: [{ scale: 0.85 }]
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2
  }
});
