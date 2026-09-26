import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ITransaction,
  IBudgetStatus,
  INotificationItem
} from '../types/index';
import { api } from '../api/client';
import { NotificationService } from '../services/notificationService';
import { AndroidListenerBridge } from '../services/androidListenerBridge';
import { IosShortcutsBridge } from '../services/iosShortcutsBridge';
import { BiometricService } from '../services/biometricService';
import { AppState, Platform } from 'react-native';

export type SyncStatus = 'connected' | 'syncing' | 'offline';

const DEFAULT_INITIAL_BUDGETS: IBudgetStatus[] = [
  {
    id: 'b_daily',
    period: 'DAILY',
    category: 'ALL',
    limitAmount: 2000,
    spentAmount: 0,
    remainingAmount: 2000,
    percentageUsed: 0,
    isExceeded: false,
    isNearLimit: false
  },
  {
    id: 'b_monthly',
    period: 'MONTHLY',
    category: 'ALL',
    limitAmount: 25000,
    spentAmount: 0,
    remainingAmount: 25000,
    percentageUsed: 0,
    isExceeded: false,
    isNearLimit: false
  }
];

interface AppContextType {
  transactions: ITransaction[];
  budgets: IBudgetStatus[];
  notifications: INotificationItem[];
  unreadCount: number;
  syncStatus: SyncStatus;
  activeTab: 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'setup';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'setup') => void;
  isTrackingActive: boolean;
  setIsTrackingActive: (active: boolean) => void;
  addTransaction: (tx: Partial<ITransaction>) => Promise<void>;
  updateTransaction: (id: string, updatedData: Partial<ITransaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  updateBudgetLimit: (period: 'DAILY' | 'MONTHLY', limitAmount: number, alertThreshold: number) => Promise<void>;
  markNotificationsRead: () => void;
  refreshData: () => Promise<void>;
  dailyReminderTime: string;
  setDailyReminderTime: (time: string) => void;
  saveDailyReminder: (time: string) => Promise<void>;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  isAppLocked: boolean;
  biometricLabel: string;
  toggleBiometricLock: (enable: boolean) => Promise<boolean>;
  unlockApp: () => void;
  lockApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [budgets, setBudgets] = useState<IBudgetStatus[]>(DEFAULT_INITIAL_BUDGETS);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'setup'>('dashboard');
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(true);
  const [dailyReminderTime, setDailyReminderTime] = useState<string>('20:30');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');

  // Biometric Lock States
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [biometricLabel, setBiometricLabel] = useState<string>('Biometrics');

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initialize Authentication & Dynamic Backend Data on App Mount
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Request notification permissions
      NotificationService.requestPermissions();

      // 2. Authenticate or establish session with Backend
      try {
        setSyncStatus('syncing');
        let token = await AsyncStorage.getItem('user_token');
        if (!token) {
          let deviceId = await AsyncStorage.getItem('device_installation_id');
          if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
            await AsyncStorage.setItem('device_installation_id', deviceId);
          }
          const sessionRes = await api.post('/auth/session', {
            deviceId,
            platform: Platform.OS
          });
          if (sessionRes.data?.success && sessionRes.data?.data?.token) {
            const newToken: string = sessionRes.data.data.token;
            token = newToken;
            await AsyncStorage.setItem('user_token', newToken);
          }
        }
        await refreshData();
      } catch (e) {
        console.warn('Backend server connecting in offline fallback mode:', e);
        setSyncStatus('offline');
      }

      // 3. Setup iOS Apple Shortcuts deep link listener
      const unsubscribeIOS = IosShortcutsBridge.initDeepLinkListener((rawText) => {
        console.log('Intercepted transaction via iOS Shortcut:', rawText);
        handleIncomingNotification(rawText, 'IOS_SHORTCUT');
      });

      // 4. Setup Android Native Notification Listener subscription
      const unsubscribeAndroid = AndroidListenerBridge.subscribeToNotifications((data) => {
        console.log('Intercepted transaction via Android Listener:', data);
        handleIncomingNotification(data.rawText, 'BANK_SMS');
      });

      // 5. Initialize Biometrics check & app lock
      BiometricService.isHardwareAvailable().then((supported) => {
        setIsBiometricSupported(supported);
        if (supported) {
          BiometricService.getBiometricLabel().then(setBiometricLabel);
          BiometricService.isBiometricLockEnabled().then((enabled) => {
            setIsBiometricEnabled(enabled);
            if (enabled) {
              setIsAppLocked(true);
            }
          });
        }
      });

      // 6. Auto-lock on app background/inactive
      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState.match(/inactive|background/)) {
          BiometricService.isBiometricLockEnabled().then((enabled) => {
            if (enabled) {
              setIsAppLocked(true);
            }
          });
        }
      });

      return () => {
        unsubscribeIOS();
        unsubscribeAndroid();
        appStateSubscription.remove();
      };
    };

    initializeApp();
  }, []);

  const handleIncomingNotification = async (rawText: string, defaultSource: any) => {
    try {
      const res = await api.post('/transactions/ingest', { rawText, source: defaultSource });
      if (res.data?.success && res.data?.data) {
        const captured: ITransaction = res.data.data;
        setTransactions((prev) => [captured, ...prev]);
        setSyncStatus('connected');

        if (res.data.alerts && res.data.alerts.length > 0) {
          for (const alert of res.data.alerts) {
            await NotificationService.sendBudgetAlert(
              alert.title,
              alert.message,
              alert.type === 'LIMIT_EXCEEDED'
            );
          }
        }
      }
    } catch {
      console.warn('Backend sync offline, could not ingest notification remotely.');
      setSyncStatus('offline');
    }
  };

  const addTransaction = async (txData: Partial<ITransaction>) => {
    const tempId = 'tx_' + Date.now();
    const newTx: ITransaction = {
      _id: tempId,
      userId: 'user_1',
      amount: txData.amount || 100,
      currency: 'INR',
      type: txData.type || 'DEBIT',
      appSource: txData.appSource || 'MANUAL',
      isManualEntry: true,
      merchantName: txData.merchantName || 'UPI Merchant',
      vpa: txData.vpa,
      bankRefNumber: txData.bankRefNumber || String(Math.floor(100000000000 + Math.random() * 900000000000)),
      category: txData.category || 'Other',
      transactionDate: txData.transactionDate || new Date().toISOString(),
      isVerified: true,
      note: txData.note,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI state update
    setTransactions((prev) => [newTx, ...prev]);

    // Update spending limits
    if (newTx.type === 'DEBIT') {
      setBudgets((prevBudgets) =>
        prevBudgets.map((b) => {
          const updatedSpent = b.spentAmount + newTx.amount;
          const percentage = Math.round((updatedSpent / b.limitAmount) * 100);
          const isOver = percentage >= 100;
          const isNear = percentage >= 80 && !isOver;

          if (isOver && !b.isExceeded) {
            NotificationService.sendBudgetAlert(
              `🚨 ${b.period} Limit Exceeded!`,
              `You have spent ₹${updatedSpent.toLocaleString('en-IN')} out of ₹${b.limitAmount.toLocaleString('en-IN')}.`,
              true
            );
            addLocalNotification('LIMIT_EXCEEDED', `🚨 ${b.period} Limit Exceeded`, `Spent ₹${updatedSpent.toLocaleString('en-IN')} of ₹${b.limitAmount.toLocaleString('en-IN')}`);
          } else if (isNear && !b.isNearLimit) {
            NotificationService.sendBudgetAlert(
              `⚠️ ${b.period} Limit Warning: ${percentage}% Used`,
              `You have ₹${(b.limitAmount - updatedSpent).toLocaleString('en-IN')} left.`,
              false
            );
            addLocalNotification('LIMIT_WARNING', `⚠️ ${b.period} Limit Warning`, `You've used ${percentage}% of your limit`);
          }

          return {
            ...b,
            spentAmount: updatedSpent,
            remainingAmount: Math.max(0, b.limitAmount - updatedSpent),
            percentageUsed: percentage,
            isExceeded: isOver,
            isNearLimit: isNear
          };
        })
      );
    }

    // Dynamic backend persistence
    try {
      const res = await api.post('/transactions/manual', {
        amount: newTx.amount,
        type: newTx.type,
        merchantName: newTx.merchantName,
        category: newTx.category,
        appSource: newTx.appSource,
        transactionDate: newTx.transactionDate,
        note: newTx.note
      });

      if (res.data?.success && res.data?.data) {
        const saved: ITransaction = res.data.data;
        setTransactions((prev) =>
          prev.map((t) => (t._id === tempId ? { ...saved, isManualEntry: true } : t))
        );
        setSyncStatus('connected');
      }
    } catch {
      setSyncStatus('offline');
    }
  };

  const updateTransaction = async (
    id: string,
    updatedData: Partial<ITransaction>
  ): Promise<boolean> => {
    const tx = transactions.find((t) => t._id === id);
    if (!tx) return false;

    const isManual = tx.isManualEntry === true || tx.appSource === 'MANUAL';
    if (!isManual) {
      console.warn('Cannot update auto-intercepted bank notification.');
      return false;
    }

    const oldAmount = tx.amount;
    const oldType = tx.type;

    const newTx: ITransaction = {
      ...tx,
      ...updatedData
    };

    setTransactions((prev) => prev.map((t) => (t._id === id ? newTx : t)));

    // Recalculate budgets if amount or type changed
    const newAmount = newTx.amount;
    const newType = newTx.type;

    if (oldType === 'DEBIT' || newType === 'DEBIT') {
      const diff =
        (newType === 'DEBIT' ? newAmount : 0) -
        (oldType === 'DEBIT' ? oldAmount : 0);

      if (diff !== 0) {
        setBudgets((prev) =>
          prev.map((b) => {
            const updatedSpent = Math.max(0, b.spentAmount + diff);
            const percentage = Math.round((updatedSpent / b.limitAmount) * 100);
            return {
              ...b,
              spentAmount: updatedSpent,
              remainingAmount: Math.max(0, b.limitAmount - updatedSpent),
              percentageUsed: percentage,
              isExceeded: percentage >= 100,
              isNearLimit: percentage >= 80 && percentage < 100
            };
          })
        );
      }
    }

    try {
      await api.put(`/transactions/${id}`, {
        amount: updatedData.amount,
        type: updatedData.type,
        merchantName: updatedData.merchantName,
        category: updatedData.category,
        note: updatedData.note,
        transactionDate: updatedData.transactionDate
      });
      setSyncStatus('connected');
    } catch {
      setSyncStatus('offline');
    }

    return true;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    const tx = transactions.find((t) => t._id === id);
    if (!tx) return false;

    const isManual = tx.isManualEntry === true || tx.appSource === 'MANUAL';
    if (!isManual) {
      console.warn('Cannot delete auto-intercepted bank notification.');
      return false;
    }

    setTransactions((prev) => prev.filter((t) => t._id !== id));

    if (tx.type === 'DEBIT') {
      setBudgets((prev) =>
        prev.map((b) => {
          const updatedSpent = Math.max(0, b.spentAmount - tx.amount);
          const percentage = Math.round((updatedSpent / b.limitAmount) * 100);
          return {
            ...b,
            spentAmount: updatedSpent,
            remainingAmount: Math.max(0, b.limitAmount - updatedSpent),
            percentageUsed: percentage,
            isExceeded: percentage >= 100,
            isNearLimit: percentage >= 80 && percentage < 100
          };
        })
      );
    }

    try {
      await api.delete(`/transactions/${id}`);
      setSyncStatus('connected');
    } catch {
      setSyncStatus('offline');
    }

    return true;
  };

  const addLocalNotification = (type: any, title: string, message: string) => {
    const item: INotificationItem = {
      _id: 'notif_' + Date.now(),
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [item, ...prev]);
  };

  const updateBudgetLimit = async (
    period: 'DAILY' | 'MONTHLY',
    limitAmount: number,
    alertThreshold: number
  ) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.period === period) {
          const percentage = Math.round((b.spentAmount / limitAmount) * 100);
          return {
            ...b,
            limitAmount,
            remainingAmount: Math.max(0, limitAmount - b.spentAmount),
            percentageUsed: percentage,
            isExceeded: percentage >= 100,
            isNearLimit: percentage >= alertThreshold
          };
        }
        return b;
      })
    );

    try {
      await api.post('/budgets/limit', {
        period,
        limitAmount,
        alertThresholdPercent: alertThreshold
      });
      setSyncStatus('connected');
    } catch {
      setSyncStatus('offline');
    }
  };

  const saveDailyReminder = async (time: string) => {
    setDailyReminderTime(time);
    const dailyBudget = budgets.find((b) => b.period === 'DAILY');
    const todaySpend = dailyBudget ? dailyBudget.spentAmount : 0;
    const dailyLimit = dailyBudget ? dailyBudget.limitAmount : 2000;

    await NotificationService.scheduleDailyReminder(time, todaySpend, dailyLimit);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post('/budgets/notifications/mark-read').catch(() => {});
  };

  const refreshData = async () => {
    try {
      setSyncStatus('syncing');
      const [dashRes, txRes, budgetRes, notifRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/transactions?limit=100'),
        api.get('/budgets'),
        api.get('/budgets/notifications')
      ]);

      let hasLive = false;

      if (budgetRes.status === 'fulfilled' && budgetRes.value.data?.success && Array.isArray(budgetRes.value.data.data)) {
        if (budgetRes.value.data.data.length > 0) {
          setBudgets(budgetRes.value.data.data);
          hasLive = true;
        }
      } else if (dashRes.status === 'fulfilled' && dashRes.value.data?.success && Array.isArray(dashRes.value.data.data?.budgets)) {
        if (dashRes.value.data.data.budgets.length > 0) {
          setBudgets(dashRes.value.data.data.budgets);
          hasLive = true;
        }
      }

      if (txRes.status === 'fulfilled' && txRes.value.data?.success && Array.isArray(txRes.value.data.data)) {
        setTransactions(txRes.value.data.data);
        hasLive = true;
      } else if (dashRes.status === 'fulfilled' && dashRes.value.data?.success && Array.isArray(dashRes.value.data.data?.recentTransactions)) {
        setTransactions(dashRes.value.data.data.recentTransactions);
        hasLive = true;
      }

      if (notifRes.status === 'fulfilled' && notifRes.value.data?.success && Array.isArray(notifRes.value.data.data)) {
        setNotifications(notifRes.value.data.data);
      }

      setSyncStatus('connected');
    } catch {
      setSyncStatus('offline');
    }
  };

  const toggleBiometricLock = async (enable: boolean): Promise<boolean> => {
    if (enable) {
      const res = await BiometricService.authenticate('Verify identity to enable Biometric App Lock');
      if (res.success) {
        await BiometricService.setBiometricLockEnabled(true);
        setIsBiometricEnabled(true);
        return true;
      }
      return false;
    } else {
      const res = await BiometricService.authenticate('Verify identity to turn off Biometric App Lock');
      if (res.success) {
        await BiometricService.setBiometricLockEnabled(false);
        setIsBiometricEnabled(false);
        setIsAppLocked(false);
        return true;
      }
      return false;
    }
  };

  const unlockApp = () => setIsAppLocked(false);
  const lockApp = () => setIsAppLocked(true);

  return (
    <AppContext.Provider
      value={{
        transactions,
        budgets,
        notifications,
        unreadCount,
        syncStatus,
        activeTab,
        setActiveTab,
        isTrackingActive,
        setIsTrackingActive,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetLimit,
        markNotificationsRead,
        refreshData,
        dailyReminderTime,
        setDailyReminderTime,
        saveDailyReminder,
        isBiometricSupported,
        isBiometricEnabled,
        isAppLocked,
        biometricLabel,
        toggleBiometricLock,
        unlockApp,
        lockApp
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
