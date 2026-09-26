import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { ITransaction } from '../../types/index';
import { Icon } from './Icon';

interface Props {
  visible: boolean;
  transaction: ITransaction | null;
  onClose: () => void;
  onEdit: (tx: ITransaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailModal: React.FC<Props> = ({
  visible,
  transaction,
  onClose,
  onEdit,
  onDelete
}) => {
  const { theme, isDark } = useTheme();

  if (!transaction) return null;

  const isManual = transaction.isManualEntry === true || transaction.appSource === 'MANUAL';
  const isDebit = transaction.type === 'DEBIT';

  const formattedDate = new Date(transaction.transactionDate).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDeletePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Delete Payment Record?',
      `Are you sure you want to delete this payment of ₹${transaction.amount.toLocaleString('en-IN')} to ${transaction.merchantName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete(transaction._id);
            onClose();
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    Haptics.selectionAsync();
    onClose();
    onEdit(transaction);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
          {/* Apple Grabber */}
          <View style={styles.grabberWrapper}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </View>

          {/* Navigation Bar */}
          <View style={[styles.navBar, { borderBottomColor: theme.separator }]}>
            <View style={{ width: 60 }} />
            <Text style={[styles.navTitle, { color: theme.textPrimary }]}>Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.doneBtnText, { color: theme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Amount Banner */}
            <View style={styles.amountBanner}>
              <Text
                style={[
                  styles.amountNumber,
                  { color: isDebit ? theme.textPrimary : theme.success }
                ]}
              >
                {isDebit ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.merchantName, { color: theme.textPrimary }]}>{transaction.merchantName}</Text>
              <Text style={[styles.dateSubtitle, { color: theme.textSecondary }]}>{formattedDate}</Text>
            </View>

            {/* Inset Grouped Details Table */}
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>TRANSACTION INFORMATION</Text>
            <View style={[styles.insetGroupCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: theme.cardBorder }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type</Text>
                <Text style={[styles.detailValue, { color: isDebit ? theme.textPrimary : theme.success }]}>
                  {isDebit ? 'Expense (Debit)' : 'Income (Credit)'}
                </Text>
              </View>

              <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{transaction.category}</Text>
              </View>

              <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Payment Source</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{transaction.appSource}</Text>
              </View>

              {transaction.bankRefNumber ? (
                <>
                  <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>UTR / Bank Ref</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{transaction.bankRefNumber}</Text>
                  </View>
                </>
              ) : null}

              {transaction.note ? (
                <>
                  <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Note / Memo</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{transaction.note}</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Edit / Delete Section for ONLY Manual Records */}
            {isManual ? (
              <View style={styles.actionsContainer}>
                <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>MANAGE RECORD</Text>
                <View style={[styles.insetGroupCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: theme.cardBorder }]}>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={handleEditPress}
                    activeOpacity={0.7}
                  >
                    <Icon name="edit" size={19} color={theme.primary} />
                    <Text style={[styles.editRowText, { color: theme.primary }]}>Edit Payment Record</Text>
                  </TouchableOpacity>

                  <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={handleDeletePress}
                    activeOpacity={0.7}
                  >
                    <Icon name="trash" size={19} color={theme.danger} />
                    <Text style={[styles.deleteRowText, { color: theme.danger }]}>Delete Payment Record</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Bank-Verified Audit Integrity Notice */
              <View style={[styles.verifiedNoticeCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', borderColor: theme.cardBorder }]}>
                <View style={[styles.lockIconCircle, { backgroundColor: theme.inputBg }]}>
                  <Icon name="lock" size={18} color={theme.textSecondary} />
                </View>
                <View style={styles.verifiedTextContainer}>
                  <Text style={[styles.verifiedTitle, { color: theme.textPrimary }]}>Bank Verified Transaction</Text>
                  <Text style={[styles.verifiedDesc, { color: theme.textSecondary }]}>
                    Auto-intercepted from bank notification. Automated records cannot be edited or deleted to preserve financial audit trail accuracy.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingVertical: 12
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 0.5
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  doneBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '600'
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36
  },
  amountBanner: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20
  },
  amountNumber: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 6
  },
  merchantName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center'
  },
  dateSubtitle: {
    fontSize: 14,
    fontWeight: '400'
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4
  },
  insetGroupCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    marginBottom: 22
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '400'
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500'
  },
  hairline: {
    height: 0.5,
    marginLeft: 16
  },
  actionsContainer: {
    marginTop: 4
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52
  },
  editRowText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14
  },
  deleteRowText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14
  },
  verifiedNoticeCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    alignItems: 'center'
  },
  lockIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  verifiedTextContainer: {
    flex: 1
  },
  verifiedTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3
  },
  verifiedDesc: {
    fontSize: 13,
    lineHeight: 18
  }
});
