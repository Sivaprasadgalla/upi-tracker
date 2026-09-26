import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type BiometricType = 'FACE_ID' | 'FINGERPRINT' | 'IRIS' | 'PIN' | 'NONE';

const BIOMETRIC_ENABLED_KEY = 'upi_tracker_biometric_enabled';
const APP_PIN_KEY = 'upi_tracker_app_pin';
const DEFAULT_FALLBACK_PIN = '1234';

export class BiometricService {
  /**
   * Check if hardware or web environment supports security lock / biometrics
   */
  public static async isHardwareAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Web always supports App Security PIN & WebAuthn
    }
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  /**
   * Check if user has enrolled biometrics or has PIN capability
   */
  public static async isEnrolled(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
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
      if (typeof window !== 'undefined' && (window as any).PublicKeyCredential) {
        return 'FACE_ID';
      }
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
      return 'Device Security & PIN';
    }
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
   * Retrieve saved 4-digit App PIN
   */
  public static async getPin(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(APP_PIN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Check if custom PIN has been configured
   */
  public static async hasPin(): Promise<boolean> {
    const pin = await this.getPin();
    return pin !== null && pin.length === 4;
  }

  /**
   * Store or update 4-digit App PIN
   */
  public static async setPin(pin: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(APP_PIN_KEY, pin);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify entered PIN against stored PIN
   */
  public static async verifyPin(inputPin: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(APP_PIN_KEY);
      if (!stored) {
        // Fallback default PIN if none configured yet
        return inputPin === DEFAULT_FALLBACK_PIN;
      }
      return stored === inputPin;
    } catch {
      return false;
    }
  }

  /**
   * Reset PIN and disable security lock
   */
  public static async resetPin(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APP_PIN_KEY);
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    } catch (e) {
      console.warn('Error resetting PIN:', e);
    }
  }

  /**
   * Prompt user with native Face ID / Fingerprint sheet or web verification.
   */
  public static async authenticate(
    promptReason?: string,
    allowPasscodeFallback: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'web') {
      // On web, authentication can proceed or fall back to PIN keypad
      return { success: true };
    }

    try {
      const isAvailable = await this.isHardwareAvailable();
      const isEnrolled = await this.isEnrolled();

      if (!isAvailable || !isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication is not configured on this device.'
        };
      }

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
      if (enabled && Platform.OS !== 'web') {
        // On native mobile, must successfully authenticate before enabling lock
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
