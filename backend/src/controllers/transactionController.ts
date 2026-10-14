import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { Budget } from '../models/Budget.js';
import { UpiParserService } from '../services/upiParser.js';
import { StatementParserService } from '../services/statementParser.js';
import { BudgetAlertService } from '../services/budgetAlertService.js';
import { AppSource } from '../types/index.js';

export const ingestNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let userId = req.user?.id;

    if (!userId) {
      // Find the most recently active user or fallback to a default user for iOS Shortcut webhooks
      const activeUser = await User.findOne().sort({ updatedAt: -1 });
      if (activeUser) {
        userId = activeUser._id.toString();
      } else {
        const defaultUser = await User.create({
          name: 'UPI User',
          email: 'device_default@upitracker.local',
          password: 'auto_default_2026!',
          platform: 'ios'
        });
        userId = defaultUser._id.toString();
      }
    }

    let payload = req.body || {};
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = { rawText: payload };
      }
    }

    const { rawText, text, message, content, body, packageName, source, transactionDate } = payload;
    let inputStr: string = (rawText || text || message || content || body || '');

    if (typeof inputStr === 'object' && inputStr !== null) {
      inputStr = (inputStr as any).content || (inputStr as any).text || (inputStr as any).body || JSON.stringify(inputStr);
    }

    if (!inputStr || typeof inputStr !== 'string' || inputStr.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Message text (rawText or text) is required.' });
      return;
    }

    const detectedSource: AppSource = source || UpiParserService.detectAppSource(inputStr, packageName);
    const parsed = UpiParserService.parse(inputStr, detectedSource);

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

    // Auto-heal existing transactions in DB where merchantName was defaulted to 'UPI Merchant'
    for (const tx of transactions) {
      if (tx.merchantName === 'UPI Merchant' && tx.rawNotification) {
        const reParsed = UpiParserService.parse(tx.rawNotification, tx.appSource);
        if (reParsed && reParsed.merchantName && reParsed.merchantName !== 'UPI Merchant') {
          tx.merchantName = reParsed.merchantName;
          Transaction.updateOne({ _id: tx._id }, { $set: { merchantName: reParsed.merchantName } }).exec();
        }
      }
    }

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

export const purgeAllUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Delete all transactions for this user
    await Transaction.deleteMany({ userId: new Types.ObjectId(userId) });

    // Reset budgets to zero spent
    await Budget.updateMany(
      { userId: new Types.ObjectId(userId) },
      { $set: { spentAmount: 0, isExceeded: false, isNearLimit: false } }
    );

    res.json({
      success: true,
      message: 'All transaction history and budgets reset. Starting 100% fresh.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to purge data.' });
  }
};

export const importStatement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Statement content (CSV text or SMS) is required.' });
      return;
    }

    const parsedItems = StatementParserService.parse(content);
    if (parsedItems.length === 0) {
      res.status(422).json({
        success: false,
        message: 'Could not extract any valid transactions from the statement. Ensure it is a valid PhonePe, Paytm, or Bank CSV/statement.'
      });
      return;
    }

    let insertedCount = 0;
    let duplicateCount = 0;
    let totalDebitAmount = 0;
    let totalCreditAmount = 0;
    const insertedTransactions: any[] = [];

    for (const item of parsedItems) {
      // Deduplication check:
      // 1. By bankRefNumber if available
      // 2. Or by same amount, type, merchantName, and date within 1 day
      let isDuplicate = false;
      if (item.bankRefNumber) {
        const existingByRef = await Transaction.findOne({
          userId: new Types.ObjectId(userId),
          bankRefNumber: item.bankRefNumber
        });
        if (existingByRef) isDuplicate = true;
      }

      if (!isDuplicate) {
        const startOfDay = new Date(item.transactionDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(item.transactionDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingFuzzy = await Transaction.findOne({
          userId: new Types.ObjectId(userId),
          amount: item.amount,
          type: item.type,
          merchantName: item.merchantName,
          transactionDate: { $gte: startOfDay, $lte: endOfDay }
        });
        if (existingFuzzy) isDuplicate = true;
      }

      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      const newTx = await Transaction.create({
        userId: new Types.ObjectId(userId),
        amount: item.amount,
        currency: 'INR',
        type: item.type,
        appSource: item.appSource,
        merchantName: item.merchantName,
        vpa: item.vpa,
        bankRefNumber: item.bankRefNumber,
        bankName: item.bankName,
        accountLast4: item.accountLast4,
        category: item.category,
        rawNotification: item.rawText,
        transactionDate: item.transactionDate,
        isVerified: true,
        isManualEntry: false
      });

      if (item.type === 'DEBIT') {
        totalDebitAmount += item.amount;
        BudgetAlertService.evaluate(userId, item.amount).catch(() => {});
      } else {
        totalCreditAmount += item.amount;
      }

      insertedCount++;
      insertedTransactions.push(newTx);
    }

    res.json({
      success: true,
      message: `Import completed: ${insertedCount} new transactions added, ${duplicateCount} duplicates skipped.`,
      stats: {
        totalParsed: parsedItems.length,
        inserted: insertedCount,
        duplicatesSkipped: duplicateCount,
        totalDebitAmount,
        totalCreditAmount
      },
      data: insertedTransactions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to import statement.' });
  }
};
