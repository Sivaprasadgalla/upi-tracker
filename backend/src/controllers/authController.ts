import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Budget } from '../models/Budget.js';
import { AuthRequest } from '../middlewares/auth.js';

const generateToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_upi_tracker_jwt_key_production_2026_x89!';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id, email }, secret, { expiresIn: expiresIn as any });
};

export const getOrCreateDefaultSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, platform, name } = req.body;
    const sanitizedId = (deviceId && typeof deviceId === 'string')
      ? deviceId.replace(/[^a-zA-Z0-9_-]/g, '')
      : 'default';
    const email = `device_${sanitizedId}@upitracker.local`;

    const validPlatform = (platform === 'ios' || platform === 'web') ? platform : 'android';

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || 'UPI User',
        email,
        password: `auto_${sanitizedId}_2026!`,
        platform: validPlatform
      });

      await Budget.create({
        userId: user._id,
        period: 'MONTHLY',
        category: 'ALL',
        limitAmount: 25000,
        alertThresholdPercent: 80,
        notifyOnExceed: true,
        notifyOnThreshold: true,
        dailyReminderEnabled: true,
        dailyReminderTime: '20:30'
      });

      await Budget.create({
        userId: user._id,
        period: 'DAILY',
        category: 'ALL',
        limitAmount: 2000,
        alertThresholdPercent: 80,
        notifyOnExceed: true,
        notifyOnThreshold: true,
        dailyReminderEnabled: true,
        dailyReminderTime: '20:30'
      });
    }

    const token = generateToken(user._id.toString(), user.email);
    res.json({
      success: true,
      message: 'Active session initialized.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          platform: user.platform
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Session error.' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, platform } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      platform: (platform === 'ios' || platform === 'web') ? platform : 'android'
    });

    // Create default monthly budget for new user (e.g. ₹25,000 monthly limit)
    await Budget.create({
      userId: user._id,
      period: 'MONTHLY',
      category: 'ALL',
      limitAmount: 25000,
      alertThresholdPercent: 80,
      notifyOnExceed: true,
      notifyOnThreshold: true,
      dailyReminderEnabled: true,
      dailyReminderTime: '20:30'
    });

    // Create default daily budget (e.g. ₹2,000 daily limit)
    await Budget.create({
      userId: user._id,
      period: 'DAILY',
      category: 'ALL',
      limitAmount: 2000,
      alertThresholdPercent: 80,
      notifyOnExceed: true,
      notifyOnThreshold: true,
      dailyReminderEnabled: true,
      dailyReminderTime: '20:30'
    });

    const token = generateToken(user._id.toString(), user.email);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          platform: user.platform,
          notificationSettings: user.notificationSettings
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user._id.toString(), user.email);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          platform: user.platform,
          notificationSettings: user.notificationSettings
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        platform: user.platform,
        notificationSettings: user.notificationSettings
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dailySummary, summaryTime, overLimitAlert, thresholdAlert, deviceToken } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (dailySummary !== undefined) user.notificationSettings.dailySummary = dailySummary;
    if (summaryTime !== undefined) user.notificationSettings.summaryTime = summaryTime;
    if (overLimitAlert !== undefined) user.notificationSettings.overLimitAlert = overLimitAlert;
    if (thresholdAlert !== undefined) user.notificationSettings.thresholdAlert = thresholdAlert;
    if (deviceToken !== undefined) user.deviceToken = deviceToken;

    await user.save();

    res.json({
      success: true,
      message: 'Notification settings updated.',
      data: user.notificationSettings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update notification settings.' });
  }
};
