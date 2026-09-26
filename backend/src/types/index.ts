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

export interface IParsedUPI {
  amount: number;
  type: TransactionType;
  appSource: AppSource;
  merchantName: string;
  vpa?: string;
  bankRefNumber?: string;
  bankName?: string;
  accountLast4?: string;
  category: CategoryType;
  rawText: string;
  confidence: number;
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
  isNearLimit: boolean; // >= alertThresholdPercent
}
