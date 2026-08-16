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
export async function registerForPushNotificationsAsync(userId: string): Promise<string> {
  let token: string = `fcm_device_${userId ? userId.substring(0, 8) : 'demo'}_${Date.now()}`;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Try to get Expo/FCM push token with a fast 1200ms timeout
    const fetchTokenPromise = Notifications.getExpoPushTokenAsync().then((t) => t?.data).catch(() => null);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    const tokenData = await Promise.race([fetchTokenPromise, timeoutPromise]);

    if (tokenData) {
      token = tokenData;
    }
  } catch (error) {
    console.log('Push Token Notice:', error);
  }

  // Always store token in user profile in Firestore
  if (userId) {
    await updateUserDoc(userId, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date().toISOString(),
    }).catch((e) => console.log('UpdateUserDoc error:', e));
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
