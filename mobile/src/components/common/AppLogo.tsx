import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G
} from 'react-native-svg';

interface AppLogoProps {
  size?: number;
  showGlow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 64, showGlow = false }) => {
  const cornerRadius = size * 0.23;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {showGlow && (
        <View
          style={[
            styles.glowShadow,
            {
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: cornerRadius * 1.3
            }
          ]}
        />
      )}
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Background Squircle Gradient */}
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0B132B" />
            <Stop offset="50%" stopColor="#1C2541" />
            <Stop offset="100%" stopColor="#0F172A" />
          </LinearGradient>

          {/* Glowing Border Gradient */}
          <LinearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#6366F1" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </LinearGradient>

          {/* Emblem Gradient (Cyan to Emerald UPI Energy) */}
          <LinearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="30%" stopColor="#38BDF8" />
            <Stop offset="70%" stopColor="#06B6D4" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>

          {/* Accent Chevron Gradient */}
          <LinearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#34D399" />
            <Stop offset="100%" stopColor="#22D3EE" />
          </LinearGradient>

          {/* Top Sheen */}
          <LinearGradient id="sheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Squircle Base */}
        <Rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx={cornerRadius}
          ry={cornerRadius}
          fill="url(#bgGrad)"
          stroke="url(#borderGrad)"
          strokeWidth="1.5"
        />

        {/* Top-Half Glass Sheen */}
        <Path
          d="M 2 25 Q 2 2 25 2 L 75 2 Q 98 2 98 25 L 98 48 Q 50 36 2 48 Z"
          fill="url(#sheenGrad)"
        />

        {/* Contactless UPI Wave Indicator (Top Right) */}
        <G opacity="0.75">
          <Path
            d="M 72 24 A 12 12 0 0 1 80 32"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 76 20 A 18 18 0 0 1 85 29"
            stroke="#818CF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Iconic Indian Rupee + UPI Forward Lightning Chevron */}
        <G>
          {/* Top Rupee Horizontal Bar */}
          <Rect x="26" y="27" width="46" height="5.5" rx="2.75" fill="url(#emblemGrad)" />

          {/* Middle Rupee Horizontal Bar */}
          <Rect x="26" y="38" width="42" height="5.5" rx="2.75" fill="url(#emblemGrad)" />

          {/* Vertical Stem */}
          <Rect x="35" y="27" width="6" height="48" rx="3" fill="url(#emblemGrad)" />

          {/* Upper Rupee Loop Arc */}
          <Path
            d="M 38 31 Q 62 31 62 43 Q 62 55 38 55"
            fill="none"
            stroke="url(#emblemGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Downward Dynamic Slanted Leg with UPI Chevron Arrow */}
          <Path
            d="M 40 54 L 62 76"
            stroke="url(#emblemGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Forward Speed Indicator Chevron */}
          <Path
            d="M 64 62 L 73 71 L 64 80"
            fill="none"
            stroke="url(#accentGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Subtle Center Glow Sparkle */}
        <Circle cx="64" cy="43" r="1.5" fill="#FFFFFF" opacity="0.9" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  glowShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10
  }
});

