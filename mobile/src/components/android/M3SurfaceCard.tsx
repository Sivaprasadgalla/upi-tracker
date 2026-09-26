import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { androidTheme } from '../../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tonal?: boolean;
}

export const M3SurfaceCard: React.FC<Props> = ({ children, style, tonal = false }) => {
  return (
    <View
      style={[
        styles.card,
        tonal ? styles.tonalSurface : styles.elevatedSurface,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: androidTheme.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: androidTheme.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  elevatedSurface: {
    backgroundColor: androidTheme.surface
  },
  tonalSurface: {
    backgroundColor: androidTheme.surfaceElevated,
    borderColor: 'transparent'
  }
});
