import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Universal Haptics Service for iOS & Android tactile feedback.
 * Safely executes haptics only on supported platforms.
 */
export const HapticsService = {
  /**
   * Light impact (subtle tap, e.g. toggles, tab switches)
   */
  async light(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore if device does not support haptics
    }
  },

  /**
   * Medium impact (e.g. button presses, modal opens)
   */
  async medium(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },

  /**
   * Heavy impact (e.g. destructive actions, major state changes)
   */
  async heavy(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },

  /**
   * Selection feedback (e.g. scrolling picker items)
   */
  async selection(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {}
  },

  /**
   * Success notification vibration
   */
  async success(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  /**
   * Warning notification vibration
   */
  async warning(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  },

  /**
   * Error notification vibration
   */
  async error(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  },
};
