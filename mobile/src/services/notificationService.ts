import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export class NotificationService {
  /**
   * Request notification permissions from user (iOS & Android 13+)
   */
  public static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('upi_limits', {
        name: 'UPI Limit Alerts & Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF453A',
        sound: 'default'
      });
    }

    return true;
  }

  /**
   * Triggers an immediate notification for budget limit alerts (e.g. 80% warning or exceeded)
   */
  public static async sendBudgetAlert(
    title: string,
    body: string,
    isExceeded: boolean = false
  ): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(
          isExceeded
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning
        );
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          badge: 1,
          data: { type: isExceeded ? 'LIMIT_EXCEEDED' : 'LIMIT_WARNING' }
        },
        trigger: null // Deliver immediately
      });
    } catch (error) {
      console.error('Error dispatching budget alert notification:', error);
    }
  }

  /**
   * Schedules a recurring Daily Evening UPI Spend Reminder at the user-specified time
   * Example: reminderTime = "20:30" (8:30 PM)
   */
  public static async scheduleDailyReminder(
    reminderTime: string,
    todaySpent: number,
    dailyLimit: number
  ): Promise<void> {
    try {
      // Cancel previous scheduled reminders first
      await this.cancelDailyReminders();

      const [hours, minutes] = reminderTime.split(':').map(Number);
      const remaining = Math.max(0, dailyLimit - todaySpent);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Daily UPI Spend Reminder',
          body: `Today's spend: ₹${todaySpent.toLocaleString('en-IN')}. Daily limit: ₹${dailyLimit.toLocaleString('en-IN')} (₹${remaining.toLocaleString('en-IN')} remaining).`,
          sound: 'default',
          data: { type: 'DAILY_REMINDER' }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours || 20,
          minute: minutes || 30
        }
      });

      console.log(`✅ Daily reminder scheduled for ${hours}:${minutes}`);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  public static async cancelDailyReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling scheduled notifications:', error);
    }
  }
}
