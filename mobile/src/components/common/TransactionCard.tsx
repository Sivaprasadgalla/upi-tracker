import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ITransaction } from '../../types/index';
import { Icon, IconName } from './Icon';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  transaction: ITransaction;
  onPress?: () => void;
  hideDivider?: boolean;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: IconName; bg: string; color: string }
> = {
  'Food & Dining': { icon: 'food', bg: 'rgba(255, 159, 10, 0.18)', color: '#FF9F0A' },
  'Groceries': { icon: 'grocery', bg: 'rgba(48, 209, 88, 0.18)', color: '#30D158' },
  'Shopping': { icon: 'shopping', bg: 'rgba(191, 90, 242, 0.18)', color: '#BF5AF2' },
  'Travel & Cab': { icon: 'travel', bg: 'rgba(10, 132, 255, 0.18)', color: '#0A84FF' },
  'Bills & Utilities': { icon: 'bill', bg: 'rgba(255, 214, 10, 0.18)', color: '#FFD60A' },
  'Entertainment': { icon: 'entertainment', bg: 'rgba(255, 55, 95, 0.18)', color: '#FF375F' },
  'Health & Medical': { icon: 'medical', bg: 'rgba(255, 69, 58, 0.18)', color: '#FF453A' },
  'Investment & Transfers': { icon: 'transfer', bg: 'rgba(100, 210, 255, 0.18)', color: '#64D2FF' },
  'Personal': { icon: 'wallet', bg: 'rgba(94, 92, 230, 0.18)', color: '#5E5CE6' },
  'Other': { icon: 'card', bg: 'rgba(142, 142, 147, 0.18)', color: '#8E8E93' }
};

const APP_LABELS: Record<string, string> = {
  GPAY: 'Google Pay',
  PHONEPE: 'PhonePe',
  PAYTM: 'Paytm',
  CRED: 'CRED',
  AMAZON_PAY: 'Amazon Pay',
  BHIM: 'BHIM',
  BANK_SMS: 'Bank SMS',
  MANUAL: 'Manual Entry',
  IOS_SHORTCUT: 'Shortcuts'
};

export const TransactionCard: React.FC<Props> = ({
  transaction,
  onPress,
  hideDivider = false
}) => {
  const { theme } = useTheme();
  const isDebit = transaction.type === 'DEBIT';
  const config = CATEGORY_CONFIG[transaction.category] || CATEGORY_CONFIG.Other;
  const appLabel = APP_LABELS[transaction.appSource] || transaction.appSource;

  const formattedDate = new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.touchable}
    >
      <View style={styles.rowContainer}>
        {/* Left: Apple HIG Squircle Icon */}
        <View style={[styles.iconSquircle, { backgroundColor: config.bg }]}>
          <Icon name={config.icon} size={22} color={config.color} />
        </View>

        {/* Center: Title & Subtitle */}
        <View style={styles.centerContainer}>
          <Text style={[styles.merchantTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {transaction.merchantName}
          </Text>
          <Text style={[styles.subDetailText, { color: theme.textSecondary }]} numberOfLines={1}>
            {transaction.category} • {formattedDate}
          </Text>
        </View>

        {/* Right: Amount & Payment Source */}
        <View style={styles.rightContainer}>
          <Text
            style={[
              styles.amountText,
              { color: isDebit ? theme.textPrimary : theme.success }
            ]}
          >
            {isDebit ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.appSourceLabel, { color: theme.textSecondary }]}>{appLabel}</Text>
        </View>
      </View>

      {!hideDivider && <View style={[styles.hairline, { backgroundColor: theme.separator }]} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    backgroundColor: 'transparent'
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  iconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  merchantTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 3
  },
  subDetailText: {
    fontSize: 14,
    letterSpacing: -0.1
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8
  },
  amountText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2
  },
  appSourceLabel: {
    fontSize: 12,
    fontWeight: '500'
  },
  hairline: {
    height: 0.5,
    marginLeft: 74
  }
});
