import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Service for Hardware-backed Encrypted Storage (iOS Keychain / Android KeyStore).
 */
export const SecureStoreService = {
  /**
   * Check if SecureStore is available on the device
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    return await SecureStore.isAvailableAsync();
  },

  /**
   * Save a key-value pair securely
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return true;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      return false;
    }
  },

  /**
   * Get an encrypted value by key
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },

  /**
   * Delete an item from SecureStore
   */
  async deleteItem(key: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return true;
      }
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('SecureStore deleteItem error:', error);
      return false;
    }
  },
};
