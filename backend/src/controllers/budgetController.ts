import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.js';
import { Budget } from '../models/Budget.js';
import { NotificationLog } from '../models/NotificationLog.js';
import { BudgetAlertService } from '../services/budgetAlertService.js';

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const statuses = await BudgetAlertService.getBudgetStatuses(userId!);

    res.json({
      success: true,
      data: statuses
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve budgets.' });
  }
};

export const upsertBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      period,
      category = 'ALL',
      limitAmount,
      alertThresholdPercent = 80,
      notifyOnExceed = true,
      notifyOnThreshold = true,
      dailyReminderEnabled = true,
      dailyReminderTime = '20:00'
    } = req.body;

    if (!period || !limitAmount) {
      res.status(400).json({ success: false, message: 'Period and limitAmount are required.' });
      return;
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        period,
        category
      },
      {
        $set: {
          limitAmount: Number(limitAmount),
          alertThresholdPercent: Number(alertThresholdPercent),
          notifyOnExceed: Boolean(notifyOnExceed),
          notifyOnThreshold: Boolean(notifyOnThreshold),
          dailyReminderEnabled: Boolean(dailyReminderEnabled),
          dailyReminderTime,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );

    const statuses = await BudgetAlertService.getBudgetStatuses(userId!);

    res.json({
      success: true,
      message: `Budget limit for ${period.toLowerCase()} updated successfully.`,
      data: budget,
      allStatuses: statuses
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update budget.' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const budget = await Budget.findOneAndUpdate(
      { _id: new Types.ObjectId(id as string), userId: new Types.ObjectId(userId) },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!budget) {
      res.status(404).json({ success: false, message: 'Budget limit not found.' });
      return;
    }

    res.json({ success: true, message: 'Budget deactivated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to deactivate budget.' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const notifications = await NotificationLog.find({
      userId: new Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await NotificationLog.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

export const markNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    await NotificationLog.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};
