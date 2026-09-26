import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  TouchableOpacity
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
}

export const MobileShell: React.FC<Props> = ({ children }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && windowWidth > 540;

  const [forceFullScreen, setForceFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formatted = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}`;
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // On small mobile screens or when user toggles full width, render children directly
  if (!isDesktop || forceFullScreen) {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  // Calculate proportional phone dimensions for desktop
  const phoneWidth = Math.min(windowWidth - 40, 420);
  const phoneHeight = Math.min(windowHeight - 70, 880);

  return (
    <View style={styles.desktopCanvas}>
      {/* Subtle ambient lighting behind phone */}
      <View style={styles.ambientGlow} />

      {/* Top Desktop Navigation & Controls Bar */}
      <View style={styles.desktopControlBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>UPI Tracker</Text>
          <View style={styles.editionBadge}>
            <Text style={styles.editionText}>iOS Cupertino</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setForceFullScreen(!forceFullScreen)}
          activeOpacity={0.7}
        >
          <Text style={styles.modeToggleText}>🖥️ Full Screen</Text>
        </TouchableOpacity>
      </View>

      {/* iPhone 16 Pro Chassis Frame */}
      <View
        style={[
          styles.phoneChassis,
          {
            width: phoneWidth,
            height: phoneHeight
          }
        ]}
      >
        {/* Dynamic Island & Status Bar Top Header */}
        <View style={styles.statusBarContainer}>
          {/* Left Time */}
          <Text style={styles.statusTimeText}>{currentTime}</Text>

          {/* Dynamic Island Pill */}
          <View style={styles.dynamicIsland}>
            {/* Camera lens reflection */}
            <View style={styles.cameraDot} />
            {/* Sensor dot */}
            <View style={styles.sensorDot} />
          </View>

          {/* Right Status Icons: Signal, Wi-Fi, Battery */}
          <View style={styles.statusIconsRow}>
            {/* Cellular Signal Bars */}
            <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <Rect x="0.5" y="8" width="2.5" height="3" rx="0.75" fill="#FFFFFF" />
              <Rect x="4.5" y="5.5" width="2.5" height="5.5" rx="0.75" fill="#FFFFFF" />
              <Rect x="8.5" y="3" width="2.5" height="8" rx="0.75" fill="#FFFFFF" />
              <Rect x="12.5" y="0.5" width="2.5" height="10.5" rx="0.75" fill="#FFFFFF" />
            </Svg>

            {/* Wi-Fi Icon */}
            <Svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <Path
                d="M7.5 9.5C8.05228 9.5 8.5 9.05228 8.5 8.5C8.5 7.94772 8.05228 7.5 7.5 7.5C6.94772 7.5 6.5 7.94772 6.5 8.5C6.5 9.05228 6.94772 9.5 7.5 9.5Z"
                fill="#FFFFFF"
              />
              <Path
                d="M4.67 5.67C5.45 4.89 6.45 4.5 7.5 4.5C8.55 4.5 9.55 4.89 10.33 5.67"
                stroke="#FFFFFF"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <Path
                d="M1.84 2.84C3.34 1.34 5.37 0.5 7.5 0.5C9.63 0.5 11.66 1.34 13.16 2.84"
                stroke="#FFFFFF"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </Svg>

            {/* Battery Indicator */}
            <View style={styles.batteryContainer}>
              <View style={styles.batteryBody}>
                <View style={styles.batteryFill} />
              </View>
              <View style={styles.batteryTip} />
            </View>
          </View>
        </View>

        {/* Screen Content */}
        <View style={styles.phoneScreen}>{children}</View>

        {/* iOS Home Indicator Bar */}
        <View style={styles.homeIndicatorContainer}>
          <View style={styles.homeIndicatorBar} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  desktopCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#07080B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  ambientGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(10, 132, 255, 0.06)',
    top: '25%',
    left: '50%',
    transform: [{ translateX: -300 }, { translateY: -300 }],
    pointerEvents: 'none'
  },
  desktopControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    marginBottom: 12,
    paddingHorizontal: 8
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2F2F7',
    letterSpacing: -0.2
  },
  editionBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8
  },
  editionText: {
    fontSize: 11,
    color: '#0A84FF',
    fontWeight: '600'
  },
  modeToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  modeToggleText: {
    fontSize: 12,
    color: '#D1D1D6',
    fontWeight: '500'
  },
  phoneChassis: {
    borderRadius: 48,
    borderWidth: 9,
    borderColor: '#1C1D24',
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 25
  },
  statusBarContainer: {
    height: 44,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  statusTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    width: 44
  },
  dynamicIsland: {
    width: 108,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  cameraDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0A0A0F',
    borderWidth: 1,
    borderColor: '#151520',
    marginRight: 6
  },
  sensorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D0D12'
  },
  statusIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: 52,
    justifyContent: 'flex-end'
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  batteryBody: {
    width: 20,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 1.5,
    justifyContent: 'center'
  },
  batteryFill: {
    width: '85%',
    height: '100%',
    backgroundColor: '#30D158',
    borderRadius: 1.5
  },
  batteryTip: {
    width: 1.5,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
    marginLeft: 0.5
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    pointerEvents: 'none'
  },
  homeIndicatorBar: {
    width: 120,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)'
  }
});
