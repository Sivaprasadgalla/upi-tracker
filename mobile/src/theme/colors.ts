export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  name: string;
  isDark: boolean;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  cardBg: string;
  cardBorder: string;
  separator: string;
  fill: string;
  primary: string;
  primaryLight: string;
  accent: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  inputBg: string;
  inputBorder: string;
  inputPlaceholder: string;
  tabBarBg: string;
  tabBarBorder: string;
  cardRadius: number;
  pillRadius: number;
  border: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

export const darkTheme: ThemeColors = {
  name: 'Dark (OLED)',
  isDark: true,
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  surfaceGlass: 'rgba(28, 28, 30, 0.88)',
  cardBg: '#1C1C1E',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  separator: '#38383A',
  fill: 'rgba(120, 120, 128, 0.24)',
  primary: '#0A84FF',
  primaryLight: 'rgba(10, 132, 255, 0.18)',
  accent: '#5E5CE6',
  success: '#30D158',
  successLight: 'rgba(48, 209, 88, 0.18)',
  warning: '#FF9F0A',
  warningLight: 'rgba(255, 159, 10, 0.18)',
  danger: '#FF453A',
  dangerLight: 'rgba(255, 69, 58, 0.18)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  inputBg: '#2C2C2E',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  inputPlaceholder: '#636366',
  tabBarBg: 'rgba(24, 24, 26, 0.96)',
  tabBarBorder: '#2C2C2E',
  cardRadius: 16,
  pillRadius: 20,
  border: 'rgba(255, 255, 255, 0.12)',
  statusBarStyle: 'light-content'
};

export const lightTheme: ThemeColors = {
  name: 'Light (Cupertino)',
  isDark: false,
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F9F9FB',
  surfaceGlass: 'rgba(255, 255, 255, 0.90)',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.08)',
  separator: '#E5E5EA',
  fill: 'rgba(118, 118, 128, 0.12)',
  primary: '#007AFF',
  primaryLight: 'rgba(0, 122, 255, 0.12)',
  accent: '#5856D6',
  success: '#34C759',
  successLight: 'rgba(52, 199, 89, 0.14)',
  warning: '#FF9500',
  warningLight: 'rgba(255, 149, 0, 0.14)',
  danger: '#FF3B30',
  dangerLight: 'rgba(255, 59, 48, 0.14)',
  textPrimary: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#8E8E93',
  inputBg: '#E5E5EA',
  inputBorder: 'rgba(0, 0, 0, 0.08)',
  inputPlaceholder: '#8E8E93',
  tabBarBg: 'rgba(255, 255, 255, 0.96)',
  tabBarBorder: '#E5E5EA',
  cardRadius: 16,
  pillRadius: 20,
  border: 'rgba(0, 0, 0, 0.08)',
  statusBarStyle: 'dark-content'
};

export const iosTheme = darkTheme;
export const androidTheme = darkTheme;

// Responsive enhanced typography and spacing
export const typography = {
  largeTitle: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: 0.38
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.36
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0.35
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.38
  },
  headline: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.4
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.4
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  screenPadding: 18,
  cardRadius: 16,
  pillRadius: 10
};
