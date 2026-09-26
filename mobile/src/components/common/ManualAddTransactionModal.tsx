import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../store/AppContext';
import { useTheme } from '../../theme/ThemeContext';
import { AppSource, CategoryType, TransactionType, ITransaction } from '../../types/index';
import { IOSSegmentedControl } from '../ios/IOSSegmentedControl';
import { AppleCalendarPicker } from './AppleCalendarPicker';
import { Icon } from './Icon';

interface Props {
  visible: boolean;
  onClose: () => void;
  transactionToEdit?: ITransaction | null;
}

const CATEGORIES: CategoryType[] = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Travel & Cab',
  'Bills & Utilities',
  'Entertainment',
  'Health & Medical',
  'Investment & Transfers',
  'Personal',
  'Other'
];

const UPI_APPS: { label: string; value: AppSource }[] = [
  { label: 'Google Pay', value: 'GPAY' },
  { label: 'PhonePe', value: 'PHONEPE' },
  { label: 'Paytm', value: 'PAYTM' },
  { label: 'CRED', value: 'CRED' },
  { label: 'Amazon Pay', value: 'AMAZON_PAY' },
  { label: 'BHIM', value: 'BHIM' },
  { label: 'Manual Entry', value: 'MANUAL' }
];

export const ManualAddTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  transactionToEdit
}) => {
  const { addTransaction, updateTransaction } = useApp();
  const { theme, isDark } = useTheme();

  const isEditing = !!transactionToEdit;

  const [typeIndex, setTypeIndex] = useState<number>(0); // 0: Expense, 1: Income
  const [amount, setAmount] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<AppSource>('MANUAL');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Food & Dining');
  const [note, setNote] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '2days' | 'custom'>('today');
  const [customDateString, setCustomDateString] = useState<string>('');
  const [showCalendarPicker, setShowCalendarPicker] = useState<boolean>(false);

  useEffect(() => {
    setShowCalendarPicker(false);
    if (transactionToEdit) {
      setTypeIndex(transactionToEdit.type === 'DEBIT' ? 0 : 1);
      setAmount(String(transactionToEdit.amount));
      setMerchantName(transactionToEdit.merchantName);
      setSelectedApp(transactionToEdit.appSource);
      setSelectedCategory(transactionToEdit.category);
      setNote(transactionToEdit.note || '');
      const d = new Date(transactionToEdit.transactionDate);
      setTransactionDate(d);
      setDatePreset('custom');
      setCustomDateString(d.toISOString().split('T')[0]);
    } else {
      setTypeIndex(0);
      setAmount('');
      setMerchantName('');
      setSelectedApp('MANUAL');
      setSelectedCategory('Food & Dining');
      setNote('');
      setTransactionDate(new Date());
      setDatePreset('today');
      setCustomDateString(new Date().toISOString().split('T')[0]);
    }
  }, [transactionToEdit, visible]);

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const handleQuickAdd = (val: number) => {
    Haptics.selectionAsync();
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleDatePreset = (preset: 'today' | 'yesterday' | '2days' | 'custom') => {
    Haptics.selectionAsync();
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      setTransactionDate(now);
      setCustomDateString(now.toISOString().split('T')[0]);
      setShowCalendarPicker(false);
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      setTransactionDate(y);
      setCustomDateString(y.toISOString().split('T')[0]);
      setShowCalendarPicker(false);
    } else if (preset === '2days') {
      const d2 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      setTransactionDate(d2);
      setCustomDateString(d2.toISOString().split('T')[0]);
      setShowCalendarPicker(false);
    } else if (preset === 'custom') {
      setShowCalendarPicker((prev) => !prev);
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Amount Required', 'Please enter a valid payment amount.');
      return;
    }

    if (!merchantName.trim()) {
      Alert.alert('Merchant Required', 'Please enter who you paid or received money from.');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const payload = {
      amount: numAmount,
      type: (typeIndex === 0 ? 'DEBIT' : 'CREDIT') as TransactionType,
      merchantName: merchantName.trim(),
      category: selectedCategory,
      appSource: selectedApp,
      note: note.trim() || undefined,
      transactionDate: transactionDate.toISOString()
    };

    if (isEditing && transactionToEdit) {
      await updateTransaction(transactionToEdit._id, payload);
    } else {
      await addTransaction(payload);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
        />
        <View style={[styles.modalSheet, { backgroundColor: theme.cardBg }]}>
          {/* Apple Grabber Capsule */}
          <TouchableOpacity
            style={styles.grabberWrapper}
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
          >
            <View style={[styles.grabber, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </TouchableOpacity>

          {/* Cupertino Navigation Header */}
          <View style={[styles.navBar, { borderBottomColor: theme.separator }]}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[styles.navCancelText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>

            <Text style={[styles.navTitle, { color: theme.textPrimary }]}>
              {isEditing ? 'Edit Payment' : 'New Payment'}
            </Text>

            <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[styles.navDoneText, { color: theme.primary }]}>
                {isEditing ? 'Save' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentContainerStyle={styles.sheetBody}
          >
            {/* Expense vs Income Segmented Control */}
            <View style={styles.segmentContainer}>
              <IOSSegmentedControl
                values={['Expense', 'Income']}
                selectedIndex={typeIndex}
                onChange={setTypeIndex}
              />
            </View>

            {/* Apple Pay Style Big Amount */}
            <View style={styles.amountDisplayContainer}>
              <Text style={[styles.amountCurrency, { color: theme.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.bigAmountInput, { color: theme.textPrimary }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textTertiary}
                autoFocus={!isEditing}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            {/* Quick Increment Pills */}
            <View style={styles.quickPillsRow}>
              {quickAmounts.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickPill, { backgroundColor: theme.inputBg }]}
                  onPress={() => handleQuickAdd(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPillText, { color: theme.primary }]}>+₹{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Selection Section */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TRANSACTION DATE</Text>
            <View style={[styles.insetGroupCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: theme.cardBorder }]}>
              <View style={styles.datePresetsRow}>
                <TouchableOpacity
                  style={[
                    styles.dateChip,
                    { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                    datePreset === 'today' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => handleDatePreset('today')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      { color: theme.textSecondary },
                      datePreset === 'today' && styles.dateChipTextActive
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateChip,
                    { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                    datePreset === 'yesterday' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => handleDatePreset('yesterday')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      { color: theme.textSecondary },
                      datePreset === 'yesterday' && styles.dateChipTextActive
                    ]}
                  >
                    Yesterday
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateChip,
                    { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                    datePreset === '2days' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => handleDatePreset('2days')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      { color: theme.textSecondary },
                      datePreset === '2days' && styles.dateChipTextActive
                    ]}
                  >
                    2 Days Ago
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateChip,
                    { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                    datePreset === 'custom' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => handleDatePreset('custom')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      { color: theme.textSecondary },
                      datePreset === 'custom' && styles.dateChipTextActive
                    ]}
                  >
                    Calendar
                  </Text>
                </TouchableOpacity>
              </View>

              {datePreset === 'custom' && showCalendarPicker && (
                <>
                  <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
                  <View style={styles.calendarContainer}>
                    <AppleCalendarPicker
                      mode="single"
                      selectedDate={transactionDate}
                      onSelectDate={(newDate) => {
                        setTransactionDate(newDate);
                        setCustomDateString(newDate.toISOString().split('T')[0]);
                        setShowCalendarPicker(false);
                      }}
                      onClose={() => setShowCalendarPicker(false)}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.dateDisplayBanner, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)' }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDatePreset('custom');
                  setShowCalendarPicker((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dateBannerLeft}>
                  <Icon name="calendar" size={17} color={theme.primary} />
                  <Text style={[styles.dateDisplayText, { color: theme.textPrimary }]}>
                    Selected: {transactionDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <Text style={[styles.changeDateHint, { color: theme.primary }]}>
                  {showCalendarPicker ? 'Hide' : 'Change Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inset Grouped Fields Table */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>TRANSACTION DETAILS</Text>
            <View style={[styles.insetGroupCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: theme.cardBorder }]}>
              {/* Row 1: Merchant */}
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Merchant</Text>
                <TextInput
                  style={[styles.fieldInput, { color: theme.textPrimary }]}
                  value={merchantName}
                  onChangeText={setMerchantName}
                  placeholder="Swiggy, Uber, or Shop"
                  placeholderTextColor={theme.textTertiary}
                  returnKeyType="next"
                />
              </View>

              <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

              {/* Row 2: Note */}
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Note</Text>
                <TextInput
                  style={[styles.fieldInput, { color: theme.textPrimary }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Optional details / memo"
                  placeholderTextColor={theme.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            {/* Category Selector */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>CATEGORY</Text>
            <View style={[styles.insetGroupCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: theme.cardBorder }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChips}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                        isSelected && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCategory(cat);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: theme.textSecondary },
                          isSelected && styles.categoryChipTextActive
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* App / Method Selector */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>PAYMENT APP</Text>
            <View style={[styles.insetGroupCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: theme.cardBorder }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChips}
              >
                {UPI_APPS.map((app) => {
                  const isSelected = selectedApp === app.value;
                  return (
                    <TouchableOpacity
                      key={app.value}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                        isSelected && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedApp(app.value);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: theme.textSecondary },
                          isSelected && styles.categoryChipTextActive
                        ]}
                      >
                        {app.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    flexShrink: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16
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
  navCancelText: {
    fontSize: 17,
    fontWeight: '400'
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  navDoneText: {
    fontSize: 17,
    fontWeight: '600'
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 220
  },
  segmentContainer: {
    marginBottom: 16
  },
  // Big Amount Display
  amountDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  amountCurrency: {
    fontSize: 38,
    fontWeight: '600',
    marginRight: 6
  },
  bigAmountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'left'
  },
  quickPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 22
  },
  quickPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginHorizontal: 4
  },
  quickPillText: {
    fontSize: 14,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4
  },
  insetGroupCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5
  },
  datePresetsRow: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between'
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '500'
  },
  dateChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  dateDisplayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dateBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  calendarContainer: {
    padding: 6
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8
  },
  changeDateHint: {
    fontSize: 13,
    fontWeight: '600'
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    width: 130
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right'
  },
  hairline: {
    height: 0.5,
    marginLeft: 16
  },
  horizontalChips: {
    padding: 10
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 8
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500'
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
});
