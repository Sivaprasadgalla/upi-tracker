import { Types } from 'mongoose';
import { Budget, IBudget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { NotificationLog } from '../models/NotificationLog.js';
import { IBudgetStatus } from '../types/index.js';

export interface AlertTrigger {
  type: 'LIMIT_WARNING' | 'LIMIT_EXCEEDED';
  budgetId: string;
  category: string;
  period: string;
  limitAmount: number;
  spentAmount: number;
  percentageUsed: number;
  title: string;
  message: string;
}

export class BudgetAlertService {
  /**
   * Calculates date range for budget period
   */
  public static getDateRange(period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === 'DAILY') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'WEEKLY') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // MONTHLY
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  /**
   * Computes current spend for a specific user, period, and category
   */
  public static async calculateSpent(
    userId: Types.ObjectId | string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    category: string = 'ALL'
  ): Promise<number> {
    const { start, end } = this.getDateRange(period);

    const matchQuery: any = {
      userId: new Types.ObjectId(userId),
      type: 'DEBIT',
      transactionDate: { $gte: start, $lte: end }
    };

    if (category && category !== 'ALL') {
      matchQuery.category = category;
    }

    const result = await Transaction.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);

    return result.length > 0 ? result[0].totalSpent : 0;
  }

  /**
   * Checks all active budgets for a user and triggers alerts if thresholds are breached
   */
  public static async evaluateBudgets(userId: Types.ObjectId | string): Promise<AlertTrigger[]> {
    const activeBudgets = await Budget.find({
      userId: new Types.ObjectId(userId),
      isActive: true
    });

    const triggeredAlerts: AlertTrigger[] = [];

    for (const b of activeBudgets) {
      const spent = await this.calculateSpent(userId, b.period, b.category);
      const percentageUsed = Math.round((spent / b.limitAmount) * 100);

      // Check if exceeded (100%+)
      if (b.notifyOnExceed && percentageUsed >= 100) {
        const title = `🚨 UPI Budget Exceeded: ${b.period}`;
        const message = `You have spent ₹${spent.toLocaleString('en-IN')} out of your ₹${b.limitAmount.toLocaleString('en-IN')} ${b.period.toLowerCase()} limit (${percentageUsed}%).`;

        // Check if recently notified today to prevent spam
        const alreadyNotified = await this.wasNotifiedRecently(userId, b._id as Types.ObjectId, 'LIMIT_EXCEEDED');
        if (!alreadyNotified) {
          await NotificationLog.create({
            userId,
            budgetId: b._id,
            type: 'LIMIT_EXCEEDED',
            title,
            message,
            metadata: { spent, limitAmount: b.limitAmount, percentageUsed }
          });

          triggeredAlerts.push({
            type: 'LIMIT_EXCEEDED',
            budgetId: b._id.toString(),
            category: b.category,
            period: b.period,
            limitAmount: b.limitAmount,
            spentAmount: spent,
            percentageUsed,
            title,
            message
          });
        }
      }
      // Check if near limit (e.g. >= 80% and < 100%)
      else if (b.notifyOnThreshold && percentageUsed >= b.alertThresholdPercent && percentageUsed < 100) {
        const title = `⚠️ Approaching UPI Limit: ${percentageUsed}% Used`;
        const message = `You've used ₹${spent.toLocaleString('en-IN')} of your ₹${b.limitAmount.toLocaleString('en-IN')} ${b.period.toLowerCase()} limit. ₹${(b.limitAmount - spent).toLocaleString('en-IN')} remaining.`;

        const alreadyNotified = await this.wasNotifiedRecently(userId, b._id as Types.ObjectId, 'LIMIT_WARNING');
        if (!alreadyNotified) {
          await NotificationLog.create({
            userId,
            budgetId: b._id,
            type: 'LIMIT_WARNING',
            title,
            message,
            metadata: { spent, limitAmount: b.limitAmount, percentageUsed }
          });

          triggeredAlerts.push({
            type: 'LIMIT_WARNING',
            budgetId: b._id.toString(),
            category: b.category,
            period: b.period,
            limitAmount: b.limitAmount,
            spentAmount: spent,
            percentageUsed,
            title,
            message
          });
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Returns complete budget statuses for UI display
   */
  public static async getBudgetStatuses(userId: Types.ObjectId | string): Promise<IBudgetStatus[]> {
    const budgets = await Budget.find({
      userId: new Types.ObjectId(userId),
      isActive: true
    }).sort({ createdAt: -1 });

    const statuses: IBudgetStatus[] = [];

    for (const b of budgets) {
      const spent = await this.calculateSpent(userId, b.period, b.category);
      const remaining = Math.max(0, b.limitAmount - spent);
      const percentageUsed = Math.round((spent / b.limitAmount) * 100);

      statuses.push({
        id: b._id.toString(),
        period: b.period,
        category: b.category,
        limitAmount: b.limitAmount,
        spentAmount: spent,
        remainingAmount: remaining,
        percentageUsed,
        isExceeded: percentageUsed >= 100,
        isNearLimit: percentageUsed >= b.alertThresholdPercent
      });
    }

    return statuses;
  }

  private static async wasNotifiedRecently(
    userId: Types.ObjectId | string,
    budgetId: Types.ObjectId,
    type: string
  ): Promise<boolean> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const existing = await NotificationLog.findOne({
      userId: new Types.ObjectId(userId),
      budgetId,
      type,
      createdAt: { $gte: sixHoursAgo }
    });
    return !!existing;
  }
}
