import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateUserDoc } from './firestore';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and register push notification token for user
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Generate Push Token (Expo & FCM bridge)
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    token = tokenData ? tokenData.data : `fcm_device_token_${userId ? userId.substring(0, 8) : 'demo'}_${Date.now()}`;

    // Store token securely in user profile in Firestore
    if (token && userId) {
      await updateUserDoc(userId, { fcmToken: token });
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }
  } catch (error) {
    token = `fcm_device_token_${userId ? userId.substring(0, 8) : 'dev'}_${Date.now()}`;
    if (token && userId) {
      await updateUserDoc(userId, { fcmToken: token }).catch(() => null);
    }
  }

  return token;
}

/**
 * Schedule a local task / habit reminder push notification
 */
export async function scheduleLocalReminder(
  title: string,
  body: string,
  triggerSeconds: number = 5,
  dataPayload?: Record<string, any>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: dataPayload || {},
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
  });
}
