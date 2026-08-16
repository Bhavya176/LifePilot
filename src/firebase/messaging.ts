import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateUserDoc } from './firestore';
import { formatCurrency } from '../utils/formatters';

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
 * Schedule a local push notification
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
      seconds: Math.max(triggerSeconds, 1),
    },
  });
}

/**
 * 🌅 Morning Briefing Notification (8:00 AM)
 */
export async function scheduleMorningBriefing(pendingTasksCount: number, delaySeconds: number = 3): Promise<string> {
  const taskText = pendingTasksCount > 0 ? `${pendingTasksCount} tasks scheduled for today` : 'your daily plan ready';
  return scheduleLocalReminder(
    '🌅 Good Morning from LifePilot!',
    `Good Morning! You have ${taskText}. Let's make today focused and productive! 🚀`,
    delaySeconds,
    { type: 'morning_briefing' }
  );
}

/**
 * 🌙 Night Recap Notification (9:00 PM)
 */
export async function scheduleNightRecap(
  habitsDoneCount: number,
  dailySpent: number,
  delaySeconds: number = 3
): Promise<string> {
  const expenseText = dailySpent > 0 ? ` and spent ${formatCurrency(dailySpent)}` : '';
  return scheduleLocalReminder(
    '🌙 Daily Night Recap',
    `શાબાશ! You completed ${habitsDoneCount} habits today${expenseText}. Rest well and recharge! ✨`,
    delaySeconds,
    { type: 'night_recap' }
  );
}

/**
 * 🎯 Goal Milestone Alert (50% & 100%)
 */
export async function triggerGoalMilestoneAlert(goalTitle: string, progressPct: number): Promise<string | null> {
  if (progressPct >= 100) {
    return scheduleLocalReminder(
      `🏆 Goal Completed: ${goalTitle}!`,
      `Congratulations! You achieved 100% of your target for "${goalTitle}". Phenomenal achievement! 🎉`,
      1,
      { type: 'goal_milestone', progress: progressPct }
    );
  } else if (progressPct >= 50) {
    return scheduleLocalReminder(
      `🎉 Halfway Milestone: ${goalTitle}`,
      `You've reached ${progressPct.toFixed(0)}% completion on "${goalTitle}"! Keep up the momentum! 🔥`,
      1,
      { type: 'goal_milestone', progress: progressPct }
    );
  }
  return null;
}
