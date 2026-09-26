import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.js';
import { Transaction } from '../models/Transaction.js';
import { BudgetAlertService } from '../services/budgetAlertService.js';

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userObjectId = new Types.ObjectId(userId);

    const now = new Date();

    // Today range
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Parallel aggregation queries for speed
    const [
      todaySpendResult,
      monthSpendResult,
      monthCreditResult,
      appBreakdownResult,
      categoryBreakdownResult,
      recentTransactions,
      budgetStatuses
    ] = await Promise.all([
      // Today debits
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'DEBIT',
            transactionDate: { $gte: startOfToday, $lte: endOfToday }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),

      // Month debits
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'DEBIT',
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),

      // Month credits
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'CREDIT',
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),

      // App Source breakdown (GPay vs PhonePe vs Paytm etc.)
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$appSource',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),

      // Category breakdown
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'DEBIT',
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),

      // 5 most recent transactions
      Transaction.find({ userId: userObjectId })
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(5),

      // Live Budget Limit Statuses
      BudgetAlertService.getBudgetStatuses(userId!)
    ]);

    const todaySpend = todaySpendResult[0]?.total || 0;
    const todayCount = todaySpendResult[0]?.count || 0;
    const monthSpend = monthSpendResult[0]?.total || 0;
    const monthCredit = monthCreditResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        summary: {
          todaySpend,
          todayCount,
          monthSpend,
          monthCredit,
          netBalance: monthCredit - monthSpend
        },
        budgets: budgetStatuses,
        appBreakdown: appBreakdownResult.map(item => ({
          appSource: item._id,
          totalAmount: item.totalAmount,
          count: item.count
        })),
        categoryBreakdown: categoryBreakdownResult.map(item => ({
          category: item._id,
          totalAmount: item.totalAmount,
          count: item.count,
          percentage: monthSpend > 0 ? Math.round((item.totalAmount / monthSpend) * 100) : 0
        })),
        recentTransactions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate dashboard analytics.' });
  }
};
