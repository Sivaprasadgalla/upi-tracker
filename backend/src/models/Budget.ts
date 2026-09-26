import mongoose, { Document, Schema, Types } from 'mongoose';
import { BudgetPeriod } from '../types/index.js';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  period: BudgetPeriod; // 'DAILY' | 'WEEKLY' | 'MONTHLY'
  category: string; // 'ALL' or specific category
  limitAmount: number;
  alertThresholdPercent: number; // default 80
  notifyOnExceed: boolean;
  notifyOnThreshold: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "20:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    period: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
      required: true,
      default: 'MONTHLY'
    },
    category: {
      type: String,
      required: true,
      default: 'ALL'
    },
    limitAmount: {
      type: Number,
      required: true,
      min: 1
    },
    alertThresholdPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    notifyOnExceed: {
      type: Boolean,
      default: true
    },
    notifyOnThreshold: {
      type: Boolean,
      default: true
    },
    dailyReminderEnabled: {
      type: Boolean,
      default: true
    },
    dailyReminderTime: {
      type: String,
      default: '20:00'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active budget for same period & category
BudgetSchema.index({ userId: 1, period: 1, category: 1, isActive: 1 });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
