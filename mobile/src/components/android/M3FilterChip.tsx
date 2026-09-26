import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { androidTheme } from '../../theme/colors';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
}

export const M3FilterChip: React.FC<Props> = ({ label, selected, onPress, count }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, selected ? styles.selectedChip : styles.unselectedChip]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, selected ? styles.selectedText : styles.unselectedText]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.badge, selected ? styles.selectedBadge : styles.unselectedBadge]}>
          <Text style={[styles.badgeText, selected ? styles.selectedBadgeText : styles.unselectedBadgeText]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: androidTheme.pillRadius,
    borderWidth: 1,
    marginRight: 8
  },
  unselectedChip: {
    backgroundColor: androidTheme.surface,
    borderColor: androidTheme.border
  },
  selectedChip: {
    backgroundColor: 'rgba(168, 199, 250, 0.15)',
    borderColor: androidTheme.primary
  },
  text: {
    fontSize: 13,
    fontWeight: '500'
  },
  unselectedText: {
    color: androidTheme.textSecondary
  },
  selectedText: {
    color: androidTheme.primary,
    fontWeight: '700'
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8
  },
  unselectedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  selectedBadge: {
    backgroundColor: androidTheme.primary
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  unselectedBadgeText: {
    color: androidTheme.textSecondary
  },
  selectedBadgeText: {
    color: '#002E54'
  }
});
