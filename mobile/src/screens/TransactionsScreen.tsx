import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { AppSource, ITransaction } from '../types/index';
import { TransactionCard } from '../components/common/TransactionCard';
import { IOSSegmentedControl } from '../components/ios/IOSSegmentedControl';
import { ManualAddTransactionModal } from '../components/common/ManualAddTransactionModal';
import { TransactionDetailModal } from '../components/common/TransactionDetailModal';
import { FloatingAddButton } from '../components/common/FloatingAddButton';
import { AppleCalendarPicker } from '../components/common/AppleCalendarPicker';
import { Icon } from '../components/common/Icon';

export const TransactionsScreen: React.FC = () => {
  const { transactions, deleteTransaction } = useApp();
  const { theme, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppSource | 'ALL'>('ALL');
  const [selectedTypeIndex, setSelectedTypeIndex] = useState<number>(0);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);

  // Custom date range state
  const now = new Date();
  const [rangeStartDate, setRangeStartDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [rangeEndDate, setRangeEndDate] = useState<Date>(now);
  const [showRangeCalendar, setShowRangeCalendar] = useState<boolean>(true);

  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<ITransaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const typeOptions = ['All', 'Expenses', 'Income'];
  const periodOptions = ['All', 'Week', 'Month', 'Year', 'Custom'];

  const appOptions: (AppSource | 'ALL')[] = [
    'ALL',
    'GPAY',
    'PHONEPE',
    'PAYTM',
    'CRED',
    'AMAZON_PAY',
    'BANK_SMS',
    'MANUAL'
  ];

  const appDisplayNames: Record<string, string> = {
    ALL: 'All Apps',
    GPAY: 'Google Pay',
    PHONEPE: 'PhonePe',
    PAYTM: 'Paytm',
    CRED: 'CRED',
    AMAZON_PAY: 'Amazon Pay',
    BANK_SMS: 'Bank SMS',
    MANUAL: 'Manual'
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txTime = new Date(tx.transactionDate).getTime();

      // Period filter
      if (selectedPeriodIndex === 1) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        if (txTime < sevenDaysAgo) return false;
      } else if (selectedPeriodIndex === 2) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        if (txTime < startOfMonth) return false;
      } else if (selectedPeriodIndex === 3) {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        if (txTime < startOfYear) return false;
      } else if (selectedPeriodIndex === 4) {
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

        if (txTime < startOfRange || txTime > endOfRange) return false;
      }

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesMerchant = tx.merchantName.toLowerCase().includes(query);
        const matchesCategory = tx.category.toLowerCase().includes(query);
        const matchesVpa = tx.vpa ? tx.vpa.toLowerCase().includes(query) : false;
        if (!matchesMerchant && !matchesCategory && !matchesVpa) return false;
      }

      // App filter
      if (selectedApp !== 'ALL' && tx.appSource !== selectedApp) {
        return false;
      }

      // Type filter
      if (selectedTypeIndex === 1 && tx.type !== 'DEBIT') return false;
      if (selectedTypeIndex === 2 && tx.type !== 'CREDIT') return false;

      return true;
    });
  }, [
    transactions,
    search,
    selectedApp,
    selectedTypeIndex,
    selectedPeriodIndex,
    rangeStartDate,
    rangeEndDate
  ]);

  const { totalDebitSum, totalCreditSum } = useMemo(() => {
    let debits = 0;
    let credits = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'DEBIT') debits += t.amount;
      else credits += t.amount;
    }
    return {
      totalDebitSum: debits,
      totalCreditSum: credits
    };
  }, [filteredTransactions]);

  const handleTransactionPress = (tx: ITransaction) => {
    setSelectedTransaction(tx);
    setIsDetailModalVisible(true);
  };

  const handleEditFromDetail = (tx: ITransaction) => {
    setTransactionToEdit(tx);
    setIsManualModalVisible(true);
  };

  const handleDeleteFromDetail = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleOpenAddModal = () => {
    setTransactionToEdit(null);
    setIsManualModalVisible(true);
  };

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
      >
        {/* Large Title Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>History</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primaryLight }]}
            onPress={handleOpenAddModal}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={18} color={theme.primary} />
            <Text style={[styles.addBtnText, { color: theme.primary }]}>Record</Text>
          </TouchableOpacity>
        </View>

        {/* Native Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.fill }]}>
          <Icon name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search merchants, UPI IDs, categories"
            placeholderTextColor={theme.textTertiary}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Timeframe UISegmentedControl with Custom Range */}
        <View style={styles.segmentWrapper}>
          <IOSSegmentedControl
            values={periodOptions}
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

        {/* Type UISegmentedControl */}
        <View style={styles.segmentWrapper}>
          <IOSSegmentedControl
            values={typeOptions}
            selectedIndex={selectedTypeIndex}
            onChange={setSelectedTypeIndex}
          />
        </View>

        {/* App Source Filters */}
        <View style={styles.appFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appChipsScroll}
          >
            {appOptions.map((app) => {
              const isSelected = selectedApp === app;
              return (
                <TouchableOpacity
                  key={app}
                  style={[
                    styles.appPill,
                    {
                      backgroundColor: isSelected
                        ? theme.textPrimary
                        : theme.cardBg,
                      borderColor: isSelected
                        ? theme.textPrimary
                        : theme.cardBorder
                    }
                  ]}
                  onPress={() => setSelectedApp(app)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.appPillText,
                      {
                        color: isSelected
                          ? (isDark ? '#000000' : '#FFFFFF')
                          : theme.textSecondary
                      },
                      isSelected && styles.appPillTextActive
                    ]}
                  >
                    {appDisplayNames[app]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Period Cashflow Summary Bar */}
        <View style={[styles.summaryBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>TOTAL SPENT</Text>
            <Text style={[styles.debitSum, { color: theme.textPrimary }]}>
              -₹{totalDebitSum.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.separator }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>TOTAL RECEIVED</Text>
            <Text style={[styles.creditSum, { color: theme.success }]}>
              +₹{totalCreditSum.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Inset Grouped Transactions Table */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            TRANSACTIONS ({filteredTransactions.length})
          </Text>
        </View>

        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, idx) => (
              <TransactionCard
                key={tx._id}
                transaction={tx}
                onPress={() => handleTransactionPress(tx)}
                hideDivider={idx === filteredTransactions.length - 1}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search" size={44} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Transactions Found</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Try adjusting your date range, search query, or app filters.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <FloatingAddButton onPress={handleOpenAddModal} />

      {/* Manual Add / Edit Transaction Modal */}
      <ManualAddTransactionModal
        visible={isManualModalVisible}
        onClose={() => {
          setIsManualModalVisible(false);
          setTransactionToEdit(null);
        }}
        transactionToEdit={transactionToEdit}
      />

      {/* Transaction Detail Sheet with Edit/Delete for Manual Records */}
      <TransactionDetailModal
        visible={isDetailModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  largeTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.38
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 5
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 12,
    marginBottom: 14
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    marginLeft: 8
  },
  segmentWrapper: {
    marginBottom: 12
  },
  customRangeContainer: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 14
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
  appFilterContainer: {
    marginBottom: 16
  },
  appChipsScroll: {
    paddingVertical: 2
  },
  appPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    marginRight: 8
  },
  appPillText: {
    fontSize: 13,
    fontWeight: '500'
  },
  appPillTextActive: {
    fontWeight: '600'
  },
  summaryBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 22
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryDivider: {
    width: 0.5,
    height: '100%'
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  debitSum: {
    fontSize: 20,
    fontWeight: '700'
  },
  creditSum: {
    fontSize: 20,
    fontWeight: '700'
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  insetGroupCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 55,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  }
});
