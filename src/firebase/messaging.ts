import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateUserDoc } from './firestore';
import { formatCurrency } from '../utils/formatters';

import Constants from 'expo-constants';

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
 * Request notification permissions and register push/local notification capability for user.
 * Seamlessly adapts to personal free Apple IDs without paid $99 APNs subscriptions.
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string> {
  let token: string = `local_device_${Platform.OS}_${userId ? userId.substring(0, 8) : 'guest'}_${Date.now()}`;
  let permissionGranted = false;

  try {
    // 1. Request notifications permissions properly for iOS & Android
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const permissionResponse = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = permissionResponse.status;
    }

    permissionGranted = finalStatus === 'granted';

    // 2. Setup Android high-priority channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'LifePilot Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    // 3. Try to get Expo Push Token if available (e.g. if running in Expo Go or if credentials exist)
    // Safely bounded with a 1500ms timeout so physical device on free team never hangs or crashes
    if (permissionGranted) {
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const fetchTokenPromise = Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        ).then((t) => t?.data).catch(() => null);

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const tokenData = await Promise.race([fetchTokenPromise, timeoutPromise]);

        if (tokenData) {
          token = tokenData;
        }
      } catch {
        // Expected on physical iOS devices signed with free personal team (no APNs capability)
      }
    }
  } catch (error) {
    console.log('[Notification Init Note]:', error);
  }

  // 4. Save device notification capabilities in Firestore user profile
  if (userId) {
    await updateUserDoc(userId, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date().toISOString(),
      notificationsEnabled: permissionGranted,
      notificationMode: token.startsWith('ExponentPushToken') ? 'remote_expo' : 'local_hardware',
    }).catch((e) => console.log('UpdateUserDoc error:', e));
  }

  return token;
}

/**
 * Schedule a local push notification (100% free, runs directly on iOS/Android hardware)
 */
export async function scheduleLocalReminder(
  title: string,
  body: string,
  triggerSeconds: number = 5,
  dataPayload?: Record<string, any>
): Promise<string> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      if (req.status !== 'granted') {
        return '';
      }
    }

    return await Notifications.scheduleNotificationAsync({
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
  } catch (error) {
    console.warn('[scheduleLocalReminder Error]:', error);
    return '';
  }
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

/**
 * ⏰ Schedule Task Reminder Notification (One-time or Daily recurring)
 */
export async function scheduleTaskReminder(params: {
  taskId?: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  isDaily?: boolean;
}): Promise<string | null> {
  const { taskId, taskTitle, taskDescription, dueDate, dueTime, isDaily } = params;

  try {
    const [hourStr, minStr] = dueTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) {
      return null;
    }

    // Ensure permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      if (req.status !== 'granted') {
        return null;
      }
    }

    const content: Notifications.NotificationContentInput = {
      title: `⏰ Task Reminder: ${taskTitle}`,
      body: taskDescription ? taskDescription : `It's time to work on "${taskTitle}"!`,
      sound: true,
      data: {
        type: 'task',
        taskId: taskId || '',
      },
    };

    if (isDaily) {
      // Repeat daily at specified hour and minute
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      return notificationId;
    }

    // Specific date/time trigger (e.g. today or tomorrow)
    const [year, month, day] = dueDate.split('-').map(Number);
    if (!year || !month || !day) return null;

    const targetDate = new Date(year, month - 1, day, hour, minute, 0);
    const now = new Date();

    // If target date is in the past, do not schedule
    if (targetDate.getTime() <= now.getTime()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('[scheduleTaskReminder Error]:', error);
    return null;
  }
}

/**
 * 🔕 Cancel a scheduled task reminder notification
 */
export async function cancelTaskReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('[cancelTaskReminder Error]:', error);
  }
}
