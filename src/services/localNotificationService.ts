import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set notification presentation options for foreground reception
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const LocalNotificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  /**
   * Send an immediate local notification (no server needed)
   */
  async triggerInstantNotification(title: string, body: string, data: Record<string, any> = {}): Promise<string> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission && Platform.OS !== 'web') {
      throw new Error('Notification permission not granted');
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // triggers immediately
    });
  },

  /**
   * Schedule a notification after N seconds
   */
  async scheduleNotification(
    title: string,
    body: string,
    seconds: number = 5,
    data: Record<string, any> = {}
  ): Promise<string> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission && Platform.OS !== 'web') {
      throw new Error('Notification permission not granted');
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
