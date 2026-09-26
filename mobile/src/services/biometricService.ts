import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type BiometricType = 'FACE_ID' | 'FINGERPRINT' | 'IRIS' | 'NONE';

const BIOMETRIC_ENABLED_KEY = 'upi_tracker_biometric_enabled';

export class BiometricService {
  /**
   * Check if hardware supports biometric authentication
   */
  public static async isHardwareAvailable(): Promise<boolean> {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  /**
   * Check if user has enrolled biometrics (Face ID or Fingerprint) in phone settings
   */
  public static async isEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  }

  /**
   * Detects whether device uses Face ID, Fingerprint, or Iris
   */
  public static async getBiometricType(): Promise<BiometricType> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'FACE_ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'FINGERPRINT';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'IRIS';
      }
      return 'NONE';
    } catch {
      return 'NONE';
    }
  }

  /**
   * Friendly display label for UI (e.g. "Face ID" on iPhone, "Fingerprint Sensor" on Android)
   */
  public static async getBiometricLabel(): Promise<string> {
    const type = await this.getBiometricType();
    if (type === 'FACE_ID') {
      return 'Face ID';
    }
    if (type === 'FINGERPRINT') {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    return 'Device Biometrics';
  }

  /**
   * Prompt user with native Face ID / Fingerprint sheet.
   * By default, forces biometric sensor (Face ID) by disabling device passcode fallback.
   */
  public static async authenticate(
    promptReason?: string,
    allowPasscodeFallback: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await this.isHardwareAvailable();
      const isEnrolled = await this.isEnrolled();

      if (!isAvailable || !isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication is not configured on this device.'
        };
      }

      // On iOS:
      // disableDeviceFallback = true forces LAPolicyDeviceOwnerAuthenticationWithBiometrics (Face ID)
      // fallbackLabel = '' disables the passcode button from appearing on Face ID modal
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptReason || 'Unlock UPI Tracker with Face ID',
        cancelLabel: 'Cancel',
        fallbackLabel: allowPasscodeFallback ? 'Use Passcode' : '',
        disableDeviceFallback: !allowPasscodeFallback
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Authentication canceled or failed.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Biometric authentication error.' };
    }
  }

  /**
   * Retrieve saved preference for whether user wants app lock enabled
   */
  public static async isBiometricLockEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Toggle biometric lock preference
   */
  public static async setBiometricLockEnabled(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        // Must successfully authenticate before enabling lock
        const auth = await this.authenticate('Confirm Face ID to enable app lock', false);
        if (!auth.success) {
          return false;
        }
      }
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
      return true;
    } catch {
      return false;
    }
  }
}
