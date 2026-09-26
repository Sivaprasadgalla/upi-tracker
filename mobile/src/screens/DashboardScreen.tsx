import React, { useState } from 'react';
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
import { LimitMeter } from '../components/common/LimitMeter';
import { TransactionCard } from '../components/common/TransactionCard';
import { ManualAddTransactionModal } from '../components/common/ManualAddTransactionModal';
import { TransactionDetailModal } from '../components/common/TransactionDetailModal';
import { FloatingAddButton } from '../components/common/FloatingAddButton';
import { Icon } from '../components/common/Icon';
import { ITransaction } from '../types/index';

export const DashboardScreen: React.FC = () => {
  const {
    transactions,
    budgets,
    unreadCount,
    setActiveTab,
    deleteTransaction,
    refreshData,
    syncStatus
  } = useApp();

  const { theme, isDark } = useTheme();

  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<ITransaction | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  // Compute stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let todaySpend = 0;
  let monthSpend = 0;

  for (const t of transactions) {
    if (t.type === 'DEBIT') {
      const txTime = new Date(t.transactionDate).getTime();
      if (txTime >= todayStart) todaySpend += t.amount;
      if (txTime >= monthStart) monthSpend += t.amount;
    }
  }

  const recentTransactions = transactions.slice(0, 5);

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

  const handleQuickSync = async () => {
    Haptics.selectionAsync();
    await refreshData();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Apple Large Title Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>Overview</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.bellButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder
              }
            ]}
            onPress={() => setActiveTab('budgets')}
            activeOpacity={0.7}
          >
            <Icon name="bell" size={22} color={theme.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: theme.danger }]}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Balance Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              shadowColor: isDark ? '#000000' : 'rgba(0, 0, 0, 0.08)'
            }
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroTag, { backgroundColor: theme.successLight }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.heroTagText, { color: theme.success }]}>
                {syncStatus === 'connected' ? 'LIVE SYNCED' : 'LOCAL MODE'}
              </Text>
            </View>
            <Text style={[styles.heroDate, { color: theme.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>Total Spent This Month</Text>
          <Text style={[styles.heroAmount, { color: theme.textPrimary }]}>
            ₹{monthSpend.toLocaleString('en-IN')}
          </Text>

          <View style={[styles.heroBottomRow, { borderTopColor: theme.separator }]}>
            <View>
              <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Today's Spend</Text>
              <Text style={[styles.subStatValue, { color: theme.textPrimary }]}>₹{todaySpend.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: theme.separator }]} />
            <View>
              <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Tracking</Text>
              <Text style={[styles.subStatValue, { color: theme.textPrimary }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Hub */}
        <View style={styles.quickActionsHub}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleOpenAddModal}
            activeOpacity={0.75}
          >
            <View style={[styles.actionCircle, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              <Icon name="plus" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setActiveTab('transactions')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Icon name="history" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setActiveTab('budgets')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Icon name="limits" size={22} color={theme.warning} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Limits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleQuickSync}
            activeOpacity={0.75}
          >
            <View style={[styles.actionCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Icon name="refresh" size={22} color={theme.success} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Active Spending Limits Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SPENDING LIMITS</Text>
          <TouchableOpacity onPress={() => setActiveTab('budgets')}>
            <Text style={[styles.sectionLink, { color: theme.primary }]}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {budgets.map((b, idx) => (
            <React.Fragment key={b.id}>
              <LimitMeter budget={b} />
              {idx < budgets.length - 1 && (
                <View style={[styles.rowDivider, { backgroundColor: theme.separator }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Latest Transactions Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 26 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity onPress={() => setActiveTab('transactions')}>
            <Text style={[styles.sectionLink, { color: theme.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, idx) => (
              <TransactionCard
                key={tx._id}
                transaction={tx}
                onPress={() => handleTransactionPress(tx)}
                hideDivider={idx === recentTransactions.length - 1}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent transactions</Text>
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
    marginBottom: 20
  },
  largeTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.38
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 8,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    padding: 22,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  heroDate: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: -0.1
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
    marginBottom: 18
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 0.5
  },
  subStatLabel: {
    fontSize: 12,
    marginBottom: 3
  },
  subStatValue: {
    fontSize: 17,
    fontWeight: '600'
  },
  heroDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 26
  },
  quickActionsHub: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 26,
    paddingHorizontal: 4
  },
  actionItem: {
    alignItems: 'center'
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '600'
  },
  insetGroupCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden'
  },
  rowDivider: {
    height: 0.5,
    marginLeft: 16
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
