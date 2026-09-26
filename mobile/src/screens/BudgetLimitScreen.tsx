import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { LimitMeter } from '../components/common/LimitMeter';
import { Icon } from '../components/common/Icon';

export const BudgetLimitScreen: React.FC = () => {
  const {
    budgets,
    updateBudgetLimit,
    notifications,
    dailyReminderTime,
    saveDailyReminder
  } = useApp();

  const { theme } = useTheme();

  const dailyBudget = budgets.find((b) => b.period === 'DAILY');
  const monthlyBudget = budgets.find((b) => b.period === 'MONTHLY');

  const [dailyInput, setDailyInput] = useState(dailyBudget ? String(dailyBudget.limitAmount) : '2000');
  const [monthlyInput, setMonthlyInput] = useState(monthlyBudget ? String(monthlyBudget.limitAmount) : '25000');

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [selectedReminderTime, setSelectedReminderTime] = useState(dailyReminderTime || '20:30');
  const [notifyThreshold, setNotifyThreshold] = useState(true);
  const [notifyExceeded, setNotifyExceeded] = useState(true);

  const reminderTimes = ['19:00', '20:00', '20:30', '21:00', '22:00'];

  const handleSaveLimits = async () => {
    const dailyNum = parseFloat(dailyInput);
    const monthlyNum = parseFloat(monthlyInput);

    if (isNaN(dailyNum) || dailyNum <= 0 || isNaN(monthlyNum) || monthlyNum <= 0) {
      Alert.alert('Invalid Limits', 'Please enter valid limit numbers in ₹.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await updateBudgetLimit('DAILY', dailyNum, 80);
    await updateBudgetLimit('MONTHLY', monthlyNum, 80);
    await saveDailyReminder(selectedReminderTime);

    Alert.alert('Limits Updated', 'Your UPI spending limits and reminders have been successfully saved to the backend database.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Title Header */}
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>Limits & Alerts</Text>
        </View>

        {/* Section 1: Live Status Meters */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>CURRENT SPENDING STATUS</Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {budgets.map((b, idx) => (
            <React.Fragment key={b.id}>
              <LimitMeter budget={b} />
              {idx < budgets.length - 1 && <View style={[styles.hairline, { backgroundColor: theme.separator }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Section 2: Set Spending Limits Form */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 26 }]}>
          SPENDING THRESHOLDS
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.tableRow}>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Daily Limit</Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>Resets every day at midnight</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.currencyPrefix, { color: theme.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.numericInput, { color: theme.textPrimary }]}
                value={dailyInput}
                onChangeText={setDailyInput}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>

          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

          <View style={styles.tableRow}>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Monthly Limit</Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>Resets 1st day of month</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.currencyPrefix, { color: theme.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.numericInput, { color: theme.textPrimary }]}
                value={monthlyInput}
                onChangeText={setMonthlyInput}
                keyboardType="numeric"
                placeholder="25000"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Section 3: Daily Evening Reminder */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 26 }]}>
          EVENING SPEND REMINDER
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.tableRow}>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Daily Summary</Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>Evening notification of UPI total</Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={setDailyReminderEnabled}
              trackColor={{ false: theme.separator, true: theme.success }}
              thumbColor="#FFFFFF"
            />
          </View>

          {dailyReminderEnabled && (
            <>
              <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
              <View style={styles.timePillSection}>
                <Text style={[styles.timePickerLabel, { color: theme.textSecondary }]}>Notification Delivery Time</Text>
                <View style={styles.timePillsRow}>
                  {reminderTimes.map((time) => {
                    const isSelected = selectedReminderTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timePill,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.inputBg
                          }
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedReminderTime(time);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.timePillText,
                            {
                              color: isSelected
                                ? '#FFFFFF'
                                : theme.textSecondary
                            }
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Section 4: Notification Alerts */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 26 }]}>
          INSTANT ALERTS
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.tableRow}>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>80% Limit Warning</Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>Warn before budget is exhausted</Text>
            </View>
            <Switch
              value={notifyThreshold}
              onValueChange={setNotifyThreshold}
              trackColor={{ false: theme.separator, true: theme.success }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

          <View style={styles.tableRow}>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>100% Exceeded Alert</Text>
              <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>Immediate alert when limit is breached</Text>
            </View>
            <Switch
              value={notifyExceeded}
              onValueChange={setNotifyExceeded}
              trackColor={{ false: theme.separator, true: theme.success }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSaveLimits}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Limits & Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Section 5: Recent Alert Notifications */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 26 }]}>
          RECENT ALERT LOG ({notifications.length})
        </Text>
        <View style={[styles.insetGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {notifications.length > 0 ? (
            notifications.map((n, idx) => (
              <View key={n._id}>
                <View style={styles.notifRow}>
                  <View style={[styles.notifIconContainer, { backgroundColor: theme.inputBg }]}>
                    <Icon
                      name={n.type === 'LIMIT_EXCEEDED' ? 'bill' : 'bell'}
                      size={20}
                      color={n.type === 'LIMIT_EXCEEDED' ? theme.danger : theme.warning}
                    />
                  </View>
                  <View style={styles.notifTextContainer}>
                    <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>{n.title}</Text>
                    <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>{n.message}</Text>
                    <Text style={[styles.notifDate, { color: theme.textTertiary }]}>
                      {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                {idx < notifications.length - 1 && (
                  <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyAlertsContainer}>
              <Text style={[styles.emptyAlertsText, { color: theme.textSecondary }]}>No alerts triggered</Text>
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
    marginBottom: 20
  },
  largeTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.38
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
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  rowLabelContainer: {
    flex: 1
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '600'
  },
  rowSubLabel: {
    fontSize: 13,
    marginTop: 2
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42
  },
  currencyPrefix: {
    fontSize: 17,
    fontWeight: '600',
    marginRight: 4
  },
  numericInput: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right'
  },
  hairline: {
    height: 0.5,
    marginLeft: 16
  },
  timePillSection: {
    padding: 16
  },
  timePickerLabel: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500'
  },
  timePillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  timePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  timePillText: {
    fontSize: 14,
    fontWeight: '600'
  },
  actionButtonsContainer: {
    marginTop: 24
  },
  saveButton: {
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  notifRow: {
    flexDirection: 'row',
    padding: 16
  },
  notifIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  notifTextContainer: {
    flex: 1
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4
  },
  notifDate: {
    fontSize: 12
  },
  emptyAlertsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyAlertsText: {
    fontSize: 14
  }
});
