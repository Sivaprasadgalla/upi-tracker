import { NativeModules, NativeEventEmitter, Platform, Linking, Alert } from 'react-native';

const { UpiNotificationModule } = NativeModules;
const eventEmitter = UpiNotificationModule ? new NativeEventEmitter(UpiNotificationModule) : null;

export class AndroidListenerBridge {
  /**
   * Checks if Android user has enabled Notification Access in system settings
   */
  public static async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    if (UpiNotificationModule && UpiNotificationModule.isPermissionGranted) {
      try {
        return await UpiNotificationModule.isPermissionGranted();
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  /**
   * Opens Android Notification Listener Settings screen directly
   */
  public static openPermissionSettings(): void {
    if (Platform.OS !== 'android') return;

    if (UpiNotificationModule && UpiNotificationModule.openSettings) {
      UpiNotificationModule.openSettings();
    } else {
      Linking.openSettings();
    }
  }

  /**
   * Subscribe to live incoming notifications forwarded from native Kotlin service
   */
  public static subscribeToNotifications(onNotification: (data: { rawText: string; packageName: string }) => void): () => void {
    if (Platform.OS !== 'android' || !eventEmitter) {
      return () => {};
    }

    const subscription = eventEmitter.addListener('onUpiNotificationReceived', onNotification);
    return () => subscription.remove();
  }
}
