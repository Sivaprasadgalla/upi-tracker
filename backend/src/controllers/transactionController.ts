import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.js';
import { Transaction } from '../models/Transaction.js';
import { UpiParserService } from '../services/upiParser.js';
import { BudgetAlertService } from '../services/budgetAlertService.js';
import { AppSource } from '../types/index.js';

export const ingestNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { rawText, packageName, source, transactionDate } = req.body;

    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ success: false, message: 'rawText string is required.' });
      return;
    }

    const detectedSource: AppSource = source || UpiParserService.detectAppSource(rawText, packageName);
    const parsed = UpiParserService.parse(rawText, detectedSource);

    if (!parsed) {
      res.status(422).json({
        success: false,
        message: 'Could not extract valid UPI transaction details from the provided notification.'
      });
      return;
    }

    // Duplicate check: if bankRefNumber exists and was recorded in the last 24 hours
    if (parsed.bankRefNumber) {
      const existing = await Transaction.findOne({
        userId: new Types.ObjectId(userId),
        bankRefNumber: parsed.bankRefNumber
      });

      if (existing) {
        res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Transaction already recorded (duplicate UTR/Ref).',
          data: existing
        });
        return;
      }
    } else {
      // Fallback duplicate check: same user, amount, merchant, within 3 minutes
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      const duplicateFuzzy = await Transaction.findOne({
        userId: new Types.ObjectId(userId),
        amount: parsed.amount,
        merchantName: parsed.merchantName,
        createdAt: { $gte: threeMinutesAgo }
      });

      if (duplicateFuzzy) {
        res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Potential duplicate transaction detected within 3 minutes.',
          data: duplicateFuzzy
        });
        return;
      }
    }

    // Create the transaction
    const transaction = await Transaction.create({
      userId: new Types.ObjectId(userId),
      amount: parsed.amount,
      type: parsed.type,
      appSource: parsed.appSource,
      merchantName: parsed.merchantName,
      vpa: parsed.vpa,
      bankRefNumber: parsed.bankRefNumber,
      bankName: parsed.bankName,
      accountLast4: parsed.accountLast4,
      category: parsed.category,
      rawNotification: parsed.rawText,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      isVerified: true,
      isManualEntry: false
    });

    // Check budget limits and evaluate alerts
    const alerts = await BudgetAlertService.evaluateBudgets(userId!);

    res.status(201).json({
      success: true,
      message: 'Transaction captured and processed successfully.',
      data: transaction,
      alerts: alerts.length > 0 ? alerts : undefined
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to ingest notification.' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 25,
      type,
      category,
      appSource,
      startDate,
      endDate,
      search
    } = req.query;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (type && ['DEBIT', 'CREDIT'].includes(type as string)) {
      query.type = type;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (appSource) {
      query.appSource = appSource;
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate as string);
      if (endDate) query.transactionDate.$lte = new Date(endDate as string);
    }

    if (search) {
      query.$or = [
        { merchantName: { $regex: search as string, $options: 'i' } },
        { vpa: { $regex: search as string, $options: 'i' } },
        { bankRefNumber: { $regex: search as string, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
  }
};

export const createManual = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { amount, type, merchantName, category, transactionDate, note, appSource } = req.body;

    if (!amount || !merchantName) {
      res.status(400).json({ success: false, message: 'Amount and merchant name are required.' });
      return;
    }

    const transaction = await Transaction.create({
      userId: new Types.ObjectId(userId),
      amount: Number(amount),
      type: type || 'DEBIT',
      merchantName,
      category: category || 'Other',
      appSource: appSource || 'MANUAL',
      isManualEntry: true,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      note,
      isVerified: true
    });

    const alerts = await BudgetAlertService.evaluateBudgets(userId!);

    res.status(201).json({
      success: true,
      message: 'Manual transaction created.',
      data: transaction,
      alerts: alerts.length > 0 ? alerts : undefined
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create transaction.' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { category, note, merchantName, amount, type, transactionDate } = req.body;

    const existing = await Transaction.findOne({
      _id: new Types.ObjectId(id as string),
      userId: new Types.ObjectId(userId)
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    const isManual = existing.isManualEntry === true || existing.appSource === 'MANUAL';
    if (!isManual) {
      res.status(403).json({
        success: false,
        message: 'Only manually entered transactions can be edited. Auto-intercepted bank records cannot be modified.'
      });
      return;
    }

    if (category) existing.category = category;
    if (note !== undefined) existing.note = note;
    if (merchantName) existing.merchantName = merchantName;
    if (amount) existing.amount = amount;
    if (type) existing.type = type;
    if (transactionDate) existing.transactionDate = new Date(transactionDate);

    await existing.save();

    res.json({ success: true, message: 'Transaction updated successfully.', data: existing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update transaction.' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const existing = await Transaction.findOne({
      _id: new Types.ObjectId(id as string),
      userId: new Types.ObjectId(userId)
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    const isManual = existing.isManualEntry === true || existing.appSource === 'MANUAL';
    if (!isManual) {
      res.status(403).json({
        success: false,
        message: 'Only manually entered transactions can be deleted. Auto-intercepted bank records cannot be removed.'
      });
      return;
    }

    await Transaction.deleteOne({ _id: existing._id });

    res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete transaction.' });
  }
};
