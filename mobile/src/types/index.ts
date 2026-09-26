export type TransactionType = 'DEBIT' | 'CREDIT';

export type AppSource =
  | 'GPAY'
  | 'PHONEPE'
  | 'PAYTM'
  | 'CRED'
  | 'AMAZON_PAY'
  | 'BHIM'
  | 'BANK_SMS'
  | 'MANUAL'
  | 'IOS_SHORTCUT';

export type CategoryType =
  | 'Food & Dining'
  | 'Groceries'
  | 'Shopping'
  | 'Travel & Cab'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Health & Medical'
  | 'Investment & Transfers'
  | 'Personal'
  | 'Other';

export interface ITransaction {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  appSource: AppSource;
  merchantName: string;
  vpa?: string;
  bankRefNumber?: string;
  bankName?: string;
  accountLast4?: string;
  category: CategoryType;
  rawNotification?: string;
  transactionDate: string;
  isVerified: boolean;
  isManualEntry?: boolean;
  note?: string;
  createdAt: string;
}

export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface IBudgetStatus {
  id: string;
  period: BudgetPeriod;
  category: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isExceeded: boolean;
  isNearLimit: boolean;
}

export interface IDashboardSummary {
  summary: {
    todaySpend: number;
    todayCount: number;
    monthSpend: number;
    monthCredit: number;
    netBalance: number;
  };
  budgets: IBudgetStatus[];
  appBreakdown: {
    appSource: AppSource;
    totalAmount: number;
    count: number;
  }[];
  categoryBreakdown: {
    category: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }[];
  recentTransactions: ITransaction[];
}

export interface INotificationItem {
  _id: string;
  type: 'LIMIT_WARNING' | 'LIMIT_EXCEEDED' | 'DAILY_REMINDER' | 'TRANSACTION_LOGGED';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface IBudgetLimitSettings {
  dailyLimit: number;
  monthlyLimit: number;
  alertThreshold: number; // e.g., 80%
  notifyOnExceed: boolean;
  notifyOnThreshold: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string; // e.g. "20:30"
}
