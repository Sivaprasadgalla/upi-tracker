import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationLog extends Document {
  userId: Types.ObjectId;
  budgetId?: Types.ObjectId;
  type: 'LIMIT_WARNING' | 'LIMIT_EXCEEDED' | 'DAILY_REMINDER' | 'TRANSACTION_LOGGED';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: 'Budget'
    },
    type: {
      type: String,
      enum: ['LIMIT_WARNING', 'LIMIT_EXCEEDED', 'DAILY_REMINDER', 'TRANSACTION_LOGGED'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

NotificationLogSchema.index({ userId: 1, createdAt: -1 });

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
