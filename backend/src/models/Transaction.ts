import mongoose, { Document, Schema, Types } from 'mongoose';
import { AppSource, CategoryType, TransactionType } from '../types/index.js';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
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
  transactionDate: Date;
  isVerified: boolean;
  isManualEntry: boolean;
  tags: string[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    type: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
      default: 'DEBIT',
      index: true
    },
    appSource: {
      type: String,
      enum: [
        'GPAY',
        'PHONEPE',
        'PAYTM',
        'CRED',
        'AMAZON_PAY',
        'BHIM',
        'BANK_SMS',
        'MANUAL',
        'IOS_SHORTCUT'
      ],
      required: true,
      default: 'MANUAL',
      index: true
    },
    merchantName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    vpa: {
      type: String,
      trim: true
    },
    bankRefNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    bankName: {
      type: String,
      trim: true
    },
    accountLast4: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      default: 'Other',
      index: true
    },
    rawNotification: {
      type: String
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    isManualEntry: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    note: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for duplicate detection
TransactionSchema.index({ userId: 1, bankRefNumber: 1 }, { unique: false });
TransactionSchema.index({ userId: 1, transactionDate: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
