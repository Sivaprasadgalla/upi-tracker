import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { IOSSegmentedControl } from '../components/ios/IOSSegmentedControl';
import { AppleCalendarPicker } from '../components/common/AppleCalendarPicker';
import { Icon, IconName } from '../components/common/Icon';

const CATEGORY_ICONS: Record<string, IconName> = {
  'Food & Dining': 'food',
  'Groceries': 'grocery',
  'Shopping': 'shopping',
  'Travel & Cab': 'travel',
  'Bills & Utilities': 'bill',
  'Entertainment': 'entertainment',
  'Health & Medical': 'medical',
  'Investment & Transfers': 'transfer',
  'Personal': 'wallet',
  'Other': 'card'
};

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#FF9F0A',
  'Groceries': '#30D158',
  'Shopping': '#BF5AF2',
  'Travel & Cab': '#0A84FF',
  'Bills & Utilities': '#FFD60A',
  'Entertainment': '#FF375F',
  'Health & Medical': '#FF453A',
  'Investment & Transfers': '#64D2FF',
  'Personal': '#5E5CE6',
  'Other': '#8E8E93'
};

export const AnalyticsScreen: React.FC = () => {
  const { transactions } = useApp();
  const { theme } = useTheme();
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(1); // Default to 'Month'

  // Custom date range state
  const now = new Date();
  const [rangeStartDate, setRangeStartDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [rangeEndDate, setRangeEndDate] = useState<Date>(now);
  const [showRangeCalendar, setShowRangeCalendar] = useState<boolean>(true);

  const timeframeLabels = ['Week', 'Month', 'Year', 'All', 'Custom'];
  const timeframeValues = ['WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME', 'CUSTOM'];

  const filteredTransactions = useMemo(() => {
    const period = timeframeValues[selectedPeriodIndex];

    return transactions.filter((tx) => {
      const txTime = new Date(tx.transactionDate).getTime();

      if (period === 'WEEKLY') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        return txTime >= weekAgo;
      }
      if (period === 'MONTHLY') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return txTime >= startOfMonth;
      }
      if (period === 'YEARLY') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        return txTime >= startOfYear;
      }
      if (period === 'CUSTOM') {
        const startOfRange = new Date(
          rangeStartDate.getFullYear(),
          rangeStartDate.getMonth(),
          rangeStartDate.getDate(),
          0,
          0,
          0
        ).getTime();
        const endOfRange = new Date(
          rangeEndDate.getFullYear(),
          rangeEndDate.getMonth(),
          rangeEndDate.getDate(),
          23,
          59,
          59
        ).getTime();
        return txTime >= startOfRange && txTime <= endOfRange;
      }
      return true;
    });
  }, [transactions, selectedPeriodIndex, rangeStartDate, rangeEndDate]);

  // Aggregate stats
  const { totalDebited, totalCredited, netSavings, categoryStats, appStats } = useMemo(() => {
    let debits = 0;
    let credits = 0;
    const catMap: Record<string, number> = {};
    const appMap: Record<string, number> = {};

    for (const t of filteredTransactions) {
      if (t.type === 'DEBIT') {
        debits += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        appMap[t.appSource] = (appMap[t.appSource] || 0) + t.amount;
      } else {
        credits += t.amount;
      }
    }

    const catList = Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: debits > 0 ? Math.round((amount / debits) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const appList = Object.entries(appMap)
      .map(([app, amount]) => ({
        app,
        amount,
        percentage: debits > 0 ? Math.round((amount / debits) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalDebited: debits,
      totalCredited: credits,
      netSavings: credits - debits,
      categoryStats: catList,
      appStats: appList
    };
  }, [filteredTransactions]);

  const formattedRangeText = `${rangeStartDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })} – ${rangeEndDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Title Header */}
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>Analytics</Text>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          <IOSSegmentedControl
            values={timeframeLabels}
            selectedIndex={selectedPeriodIndex}
            onChange={setSelectedPeriodIndex}
          />
        </View>

        {/* Custom Date Range Card with Interactive Calendar */}
        {selectedPeriodIndex === 4 && (
          <View style={[styles.customRangeContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.rangeHeaderRow}>
              <View style={styles.rangeInfoLeft}>
                <Icon name="calendar" size={18} color={theme.primary} />
                <Text style={[styles.rangeHeaderText, { color: theme.textPrimary }]}>{formattedRangeText}</Text>
              </View>

              <TouchableOpacity
                style={[styles.toggleCalendarBtn, { backgroundColor: theme.primaryLight }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowRangeCalendar((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleCalendarText, { color: theme.primary }]}>
                  {showRangeCalendar ? 'Hide' : 'Change Range'}
                </Text>
              </TouchableOpacity>
            </View>

            {showRangeCalendar && (
              <View style={styles.calendarPickerBox}>
                <AppleCalendarPicker
                  mode="range"
                  startDate={rangeStartDate}
                  endDate={rangeEndDate}
                  onSelectRange={(start, end) => {
                    setRangeStartDate(start);
                    setRangeEndDate(end);
                  }}
                  onClose={() => setShowRangeCalendar(false)}
                />
              </View>
            )}
          </View>
        )}

        {/* Section 1: Cashflow Overview Card */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>CASHFLOW BREAKDOWN</Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.netSavingsBox}>
            <Text style={[styles.netSavingsLabel, { color: theme.textSecondary }]}>Net Cashflow</Text>
            <Text
              style={[
                styles.netSavingsValue,
                { color: netSavings >= 0 ? theme.success : theme.danger }
              ]}
            >
              {netSavings >= 0 ? '+' : '-'}₹{Math.abs(netSavings).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

          <View style={styles.cashflowRow}>
            <View style={styles.cashflowCol}>
              <Text style={[styles.cashflowLabel, { color: theme.textSecondary }]}>TOTAL SPENT</Text>
              <Text style={[styles.debitFigure, { color: theme.textPrimary }]}>
                -₹{totalDebited.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.vDivider, { backgroundColor: theme.separator }]} />
            <View style={styles.cashflowCol}>
              <Text style={[styles.cashflowLabel, { color: theme.textSecondary }]}>TOTAL RECEIVED</Text>
              <Text style={[styles.creditFigure, { color: theme.success }]}>
                +₹{totalCredited.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Category Breakdown */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 26 }]}>
          SPENDING BY CATEGORY
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {categoryStats.length > 0 ? (
            categoryStats.map((item, idx) => {
              const iconName = CATEGORY_ICONS[item.category] || 'card';
              const color = CATEGORY_COLORS[item.category] || theme.primary;

              return (
                <View key={item.category}>
                  <View style={styles.statRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${color}25` }]}>
                      <Icon name={iconName} size={20} color={color} />
                    </View>

                    <View style={styles.statContent}>
                      <View style={styles.statTop}>
                        <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>{item.category}</Text>
                        <Text style={[styles.categoryAmount, { color: theme.textPrimary }]}>
                          ₹{item.amount.toLocaleString('en-IN')}{' '}
                          <Text style={[styles.pctText, { color: theme.textSecondary }]}>({item.percentage}%)</Text>
                        </Text>
                      </View>

                      {/* Progress Track */}
                      <View style={[styles.track, { backgroundColor: theme.fill }]}>
                        <View
                          style={[
                            styles.fill,
                            { width: `${Math.min(item.percentage, 100)}%`, backgroundColor: color }
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  {idx < categoryStats.length - 1 && (
                    <View style={[styles.innerHairline, { backgroundColor: theme.separator }]} />
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No spending in this timeframe</Text>
            </View>
          )}
        </View>

        {/* Section 3: App Breakdown */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 26 }]}>
          SPENDING BY PAYMENT APP
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {appStats.length > 0 ? (
            appStats.map((item, idx) => (
              <View key={item.app}>
                <View style={styles.statRow}>
                  <View style={[styles.appIconContainer, { backgroundColor: theme.primaryLight }]}>
                    <Icon name="history" size={20} color={theme.primary} />
                  </View>

                  <View style={styles.statContent}>
                    <View style={styles.statTop}>
                      <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>{item.app}</Text>
                      <Text style={[styles.categoryAmount, { color: theme.textPrimary }]}>
                        ₹{item.amount.toLocaleString('en-IN')}{' '}
                        <Text style={[styles.pctText, { color: theme.textSecondary }]}>({item.percentage}%)</Text>
                      </Text>
                    </View>

                    <View style={[styles.track, { backgroundColor: theme.fill }]}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.min(item.percentage, 100)}%`, backgroundColor: theme.primary }
                        ]}
                      />
                    </View>
                  </View>
                </View>
                {idx < appStats.length - 1 && (
                  <View style={[styles.innerHairline, { backgroundColor: theme.separator }]} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No app usage in this timeframe</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 110
  },
  header: {
    marginBottom: 16
  },
  largeTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.38
  },
  timeframeContainer: {
    marginBottom: 16
  },
  customRangeContainer: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 16
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rangeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rangeHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8
  },
  toggleCalendarBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  toggleCalendarText: {
    fontSize: 13,
    fontWeight: '600'
  },
  calendarPickerBox: {
    marginTop: 12
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4
  },
  insetGroupCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden'
  },
  netSavingsBox: {
    padding: 18,
    alignItems: 'center'
  },
  netSavingsLabel: {
    fontSize: 14,
    marginBottom: 4
  },
  netSavingsValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.8
  },
  cashflowRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16
  },
  cashflowCol: {
    flex: 1,
    alignItems: 'center'
  },
  cashflowLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  debitFigure: {
    fontSize: 20,
    fontWeight: '700'
  },
  creditFigure: {
    fontSize: 20,
    fontWeight: '700'
  },
  vDivider: {
    width: 0.5
  },
  hairline: {
    height: 0.5
  },
  innerHairline: {
    height: 0.5,
    marginLeft: 66
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  statContent: {
    flex: 1
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600'
  },
  pctText: {
    fontSize: 13,
    fontWeight: '400'
  },
  track: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 3.5
  },
  emptyContainer: {
    padding: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 15
  }
});
