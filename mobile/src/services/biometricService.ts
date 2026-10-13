import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type BiometricType = 'FACE_ID' | 'FINGERPRINT' | 'IRIS' | 'PIN' | 'NONE';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

const APP_LOCK_KEY = 'upi_tracker_app_lock_enabled';
const BIOMETRIC_ENABLED_KEY = 'upi_tracker_biometric_enabled';
const APP_PIN_KEY = 'upi_tracker_app_pin';
export const DEFAULT_FALLBACK_PIN = '1234';

export class BiometricService {
  /**
   * Check if hardware or web environment supports security lock / biometrics
   */
  public static async isHardwareAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  /**
   * Check if user has enrolled biometrics in device settings
   */
  public static async isEnrolled(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  }

  /**
   * Detects whether device uses Face ID, Fingerprint, Iris, or PIN
   */
  public static async getBiometricType(): Promise<BiometricType> {
    if (Platform.OS === 'web') {
      return 'PIN';
    }
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
   * Friendly display label for UI
   */
  public static async getBiometricLabel(): Promise<string> {
    if (Platform.OS === 'web') {
      return 'Device Passcode';
    }
    const type = await this.getBiometricType();
    if (type === 'FACE_ID') {
      return 'Face ID';
    }
    if (type === 'FINGERPRINT') {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    return 'Face ID & Passcode';
  }

  /**
   * Prompt user with native Face ID / Touch ID sheet with seamless native device passcode fallback.
   * This uses the single native Apple security prompt: Face ID scans first; if not recognized,
   * the user enters their device passcode on the Apple sheet to unlock.
   */
  public static async authenticate(
    promptReason: string = 'Unlock UPI Tracker'
  ): Promise<BiometricAuthResult> {
    if (Platform.OS === 'web') {
      return { success: true };
    }

    try {
      const isAvailable = await this.isHardwareAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric / device authentication is not available on this device.',
          errorCode: 'not_available'
        };
      }

      // disableDeviceFallback: false allows native iOS device passcode fallback sheet.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptReason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false
      });

      if (result.success) {
        return { success: true };
      } else {
        const errorCode = result.error || 'unknown';
        let friendlyMessage = 'Authentication canceled or failed.';
        if (errorCode === 'user_cancel' || errorCode === 'system_cancel' || errorCode === 'app_cancel') {
          friendlyMessage = 'Authentication canceled.';
        } else if (errorCode === 'authentication_failed') {
          friendlyMessage = 'Face ID not recognized.';
        } else if (errorCode === 'lockout') {
          friendlyMessage = 'Biometrics locked. Enter device passcode.';
        } else if (errorCode === 'not_enrolled') {
          friendlyMessage = 'Face ID is not enrolled in iPhone Settings.';
        } else if (errorCode === 'not_available' || (errorCode as string) === 'missing_usage_description') {
          friendlyMessage = 'Face ID permission needed in iPhone Settings > Expo Go.';
        }

        return {
          success: false,
          error: friendlyMessage,
          errorCode
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Authentication error.',
        errorCode: 'error'
      };
    }
  }

  /**
   * Check whether App Security Lock is enabled
   */
  public static async isAppLockEnabled(): Promise<boolean> {
    try {
      const lockVal = await AsyncStorage.getItem(APP_LOCK_KEY);
      if (lockVal !== null) {
        return lockVal === 'true';
      }
      const legacyVal = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (legacyVal !== null) {
        return legacyVal === 'true';
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Set App Security Lock preference
   */
  public static async setAppLockEnabled(enabled: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(APP_LOCK_KEY, enabled ? 'true' : 'false');
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check whether Face ID / Biometrics is preferred for unlocking
   */
  public static async isBiometricEnabled(): Promise<boolean> {
    return this.isAppLockEnabled();
  }

  /**
   * Set Face ID / Biometrics preference
   */
  public static async setBiometricEnabled(enabled: boolean): Promise<boolean> {
    return this.setAppLockEnabled(enabled);
  }

  /**
   * Backwards-compatibility aliases
   */
  public static async isBiometricLockEnabled(): Promise<boolean> {
    return this.isAppLockEnabled();
  }

  public static async setBiometricLockEnabled(enabled: boolean, skipAuth: boolean = false): Promise<boolean> {
    return this.setAppLockEnabled(enabled);
  }

  public static async getPin(): Promise<string | null> {
    return AsyncStorage.getItem(APP_PIN_KEY);
  }

  public static async hasCustomPin(): Promise<boolean> {
    const pin = await this.getPin();
    return pin !== null && pin.length === 4;
  }

  public static async hasPin(): Promise<boolean> {
    return this.hasCustomPin();
  }

  public static async setPin(pin: string): Promise<boolean> {
    await AsyncStorage.setItem(APP_PIN_KEY, pin);
    await AsyncStorage.setItem(APP_LOCK_KEY, 'true');
    return true;
  }

  public static async verifyPin(inputPin: string): Promise<boolean> {
    const stored = await AsyncStorage.getItem(APP_PIN_KEY);
    return (stored || DEFAULT_FALLBACK_PIN) === inputPin;
  }

  public static async resetPin(): Promise<void> {
    await AsyncStorage.removeItem(APP_PIN_KEY);
    await AsyncStorage.setItem(APP_LOCK_KEY, 'false');
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
  }
}
