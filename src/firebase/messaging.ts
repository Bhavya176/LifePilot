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

    // 2. Setup Android high-priority channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'LifePilot Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
      await Notifications.setNotificationChannelAsync('task_alarms', {
        name: '🚨 Urgent Task Alarms',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 600, 300, 600, 300, 800],
        lightColor: '#EF4444',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
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
 * ⏰ Schedule Task Reminder Notification (Standard or Persistent Repeat Alarm)
 */
export async function scheduleTaskReminder(params: {
  taskId?: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  isDaily?: boolean;
  isAlarm?: boolean;
}): Promise<string | null> {
  const { taskId, taskTitle, taskDescription, dueDate, dueTime, isDaily, isAlarm } = params;

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

    const scheduledIds: string[] = [];

    if (isDaily) {
      // Repeat daily at specified hour and minute
      const content: Notifications.NotificationContentInput = {
        title: isAlarm ? `🚨 ALARM: ${taskTitle}` : `⏰ Task Reminder: ${taskTitle}`,
        body: taskDescription ? taskDescription : `It's time to work on "${taskTitle}"!`,
        sound: true,
        data: {
          type: isAlarm ? 'task_alarm' : 'task',
          taskId: taskId || '',
          taskTitle,
          dueTime,
          isAlarm: !!isAlarm,
        },
        ...(Platform.OS === 'android' ? { channelId: isAlarm ? 'task_alarms' : 'default' } : {}),
      };

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      if (id) scheduledIds.push(id);
      return scheduledIds.join(',');
    }

    // Specific date/time trigger (e.g. today or tomorrow)
    const [year, month, day] = dueDate.split('-').map(Number);
    if (!year || !month || !day) return null;

    const baseTargetDate = new Date(year, month - 1, day, hour, minute, 0);
    const now = new Date();

    // If base target date is in the past, do not schedule
    if (baseTargetDate.getTime() <= now.getTime()) {
      return null;
    }

    // If Persistent Alarm Mode is ON, schedule 5 sequential repeat alarms (T, T+1m, T+2m, T+3m, T+5m)
    const minuteOffsets = isAlarm ? [0, 1, 2, 3, 5] : [0];

    for (const offset of minuteOffsets) {
      const targetDate = new Date(baseTargetDate.getTime() + offset * 60 * 1000);
      if (targetDate.getTime() <= now.getTime()) continue;

      const content: Notifications.NotificationContentInput = {
        title: isAlarm
          ? (offset === 0 ? `🚨 ALARM: ${taskTitle}` : `🚨 URGENT ALARM: ${taskTitle}`)
          : `⏰ Task Reminder: ${taskTitle}`,
        body: isAlarm
          ? (offset === 0
              ? (taskDescription || `It's time to work on "${taskTitle}"! Tap to open alarm.`)
              : `⚠️ REMINDER (${offset}m elapsed): "${taskTitle}" is pending! Tap to dismiss.`)
          : (taskDescription || `It's time to work on "${taskTitle}"!`),
        sound: true,
        data: {
          type: isAlarm ? 'task_alarm' : 'task',
          taskId: taskId || '',
          taskTitle,
          dueTime,
          isAlarm: !!isAlarm,
          offsetMinute: offset,
        },
        ...(Platform.OS === 'android' ? { channelId: isAlarm ? 'task_alarms' : 'default' } : {}),
      };

      const notifId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },
      });

      if (notifId) {
        scheduledIds.push(notifId);
      }
    }

    return scheduledIds.length > 0 ? scheduledIds.join(',') : null;
  } catch (error) {
    console.warn('[scheduleTaskReminder Error]:', error);
    return null;
  }
}

/**
 * 🔕 Cancel a scheduled task reminder notification (single or comma-separated list of IDs)
 */
export async function cancelTaskReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    const ids = notificationId.split(',').map((id) => id.trim()).filter(Boolean);
    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
    );
  } catch (error) {
    console.warn('[cancelTaskReminder Error]:', error);
  }
}

/**
 * 💤 Schedule a Snooze Alarm notification (default 5 minutes from now)
 */
export async function scheduleSnoozeAlarm(params: {
  taskId?: string;
  taskTitle: string;
  minutes?: number;
}): Promise<string | null> {
  const { taskId, taskTitle, minutes = 5 } = params;
  try {
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    const content: Notifications.NotificationContentInput = {
      title: `🚨 SNOOZED ALARM: ${taskTitle}`,
      body: `Snooze timer expired (${minutes}m). Time to finish "${taskTitle}"!`,
      sound: true,
      data: {
        type: 'task_alarm',
        taskId: taskId || '',
        taskTitle,
        isAlarm: true,
      },
      ...(Platform.OS === 'android' ? { channelId: 'task_alarms' } : {}),
    };
    return await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeDate,
      },
    });
  } catch (error) {
    console.warn('[scheduleSnoozeAlarm Error]:', error);
    return null;
  }
}
