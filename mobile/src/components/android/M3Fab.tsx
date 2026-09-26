import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { androidTheme } from '../../theme/colors';

interface Props {
  icon?: string;
  label?: string;
  onPress: () => void;
}

export const M3Fab: React.FC<Props> = ({ icon = '➕', label = 'Log UPI', onPress }) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.icon}>{icon}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: androidTheme.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8
  },
  icon: {
    fontSize: 18,
    marginRight: 8
  },
  label: {
    color: '#00315B',
    fontWeight: '700',
    fontSize: 15
  }
});
