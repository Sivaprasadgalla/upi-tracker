import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { iosTheme } from '../../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlightBorder?: boolean;
}

export const IOSGlassCard: React.FC<Props> = ({ children, style, highlightBorder = false }) => {
  return (
    <View
      style={[
        styles.outerContainer,
        highlightBorder && styles.highlightedBorder,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: iosTheme.cardRadius,
    backgroundColor: iosTheme.surface, // Apple Inset Grouped Card
    borderWidth: 0.5,
    borderColor: iosTheme.border,
    overflow: 'hidden'
  },
  highlightedBorder: {
    borderColor: 'rgba(10, 132, 255, 0.4)'
  }
});
