import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  currency: string;
  deviceToken?: string;
  platform?: 'android' | 'ios' | 'web';
  notificationSettings: {
    dailySummary: boolean;
    summaryTime: string; // "21:00"
    overLimitAlert: boolean;
    thresholdAlert: boolean;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    deviceToken: {
      type: String,
      default: null
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android'
    },
    notificationSettings: {
      dailySummary: { type: Boolean, default: true },
      summaryTime: { type: String, default: '21:00' },
      overLimitAlert: { type: Boolean, default: true },
      thresholdAlert: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
