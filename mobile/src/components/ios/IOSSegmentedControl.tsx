import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const IOSSegmentedControl: React.FC<Props> = ({
  values,
  selectedIndex,
  onChange
}) => {
  const { theme, isDark } = useTheme();

  const handlePress = (index: number) => {
    Haptics.selectionAsync();
    onChange(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.fill }]}>
      {values.map((val, idx) => {
        const isSelected = selectedIndex === idx;
        return (
          <TouchableOpacity
            key={val}
            style={[
              styles.segment,
              isSelected && [
                styles.activeSegment,
                {
                  backgroundColor: isDark ? '#636366' : '#FFFFFF',
                  shadowColor: isDark ? '#000000' : 'rgba(0, 0, 0, 0.15)'
                }
              ]
            ]}
            onPress={() => handlePress(idx)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.text,
                { color: isSelected ? theme.textPrimary : theme.textSecondary },
                isSelected && styles.activeText
              ]}
            >
              {val}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2.5,
    height: 38,
    alignItems: 'center'
  },
  segment: {
    flex: 1,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  activeSegment: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 2
  },
  text: {
    fontSize: 14,
    fontWeight: '500'
  },
  activeText: {
    fontWeight: '600'
  }
});
