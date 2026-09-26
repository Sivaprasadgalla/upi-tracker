import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IBudgetStatus } from '../../types/index';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  budget: IBudgetStatus;
  onPressConfigure?: () => void;
}

export const LimitMeter: React.FC<Props> = ({ budget }) => {
  const { theme } = useTheme();
  const percentage = Math.min(Math.round(budget.percentageUsed), 100);
  const isOver = budget.percentageUsed >= 100;
  const isWarning = budget.percentageUsed >= 80 && !isOver;

  // Determine progress color
  const barColor = isOver
    ? theme.danger
    : isWarning
    ? theme.warning
    : theme.success;

  const remaining = Math.max(0, budget.limitAmount - budget.spentAmount);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.periodTitle, { color: theme.textSecondary }]}>
          {budget.period} SPENDING
        </Text>
        <Text style={[styles.percentageBadge, { color: barColor }]}>
          {budget.percentageUsed}% USED
        </Text>
      </View>

      {/* Primary Figures: Apple Style */}
      <View style={styles.numbersRow}>
        <Text style={[styles.spentAmount, { color: theme.textPrimary }]}>
          ₹{budget.spentAmount.toLocaleString('en-IN')}{' '}
          <Text style={[styles.limitAmount, { color: theme.textSecondary }]}>
            / ₹{budget.limitAmount.toLocaleString('en-IN')}
          </Text>
        </Text>
      </View>

      {/* Smooth Apple Progress Capsule */}
      <View style={[styles.track, { backgroundColor: theme.fill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor
            }
          ]}
        />
      </View>

      {/* Sub-detail footer */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          {isOver
            ? `Limit exceeded by ₹${(budget.spentAmount - budget.limitAmount).toLocaleString('en-IN')}`
            : `₹${remaining.toLocaleString('en-IN')} remaining in limit`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  periodTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  percentageBadge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  numbersRow: {
    marginBottom: 12
  },
  spentAmount: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  limitAmount: {
    fontSize: 17,
    fontWeight: '500'
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10
  },
  fill: {
    height: '100%',
    borderRadius: 4
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 14,
    letterSpacing: -0.1
  }
});
