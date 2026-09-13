import React, { useEffect } from 'react';
import { Stack, useNavigationContainerRef, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { NetworkProvider } from '../context/NetworkContext';
import { SecurityProvider } from '../context/SecurityContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { AppUpdateModal } from '../components/ui/AppUpdateModal';
import { initAppCheck } from '../firebase/appCheck';
import { initRemoteConfig } from '../firebase/remoteConfig';
import { initSentry, routingInstrumentation } from '../services/sentry';

import { TaskAlarmModal } from '../components/ui/TaskAlarmModal';
import { cancelTaskReminder, scheduleSnoozeAlarm } from '../firebase/messaging';
import { taskService } from '../services/taskService';
import { auth } from '../firebase/auth';

// Initialize Sentry error reporting before mounting component tree
initSentry();

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  const router = useRouter();

  const [activeAlarm, setActiveAlarm] = React.useState<{
    taskId?: string;
    taskTitle: string;
    dueTime?: string;
    notificationId?: string;
  } | null>(null);

  useEffect(() => {
    if (navigationRef) {
      routingInstrumentation.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    // Asynchronously initialize App Check and Remote Config
    initAppCheck().catch(() => {});
    initRemoteConfig().catch(() => {});

    // Listen to notification interactions when user taps banner in background/lock screen
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
      if (data?.isAlarm || data?.type === 'task_alarm') {
        const notifTitle = (data?.taskTitle as string) || (response?.notification?.request?.content?.title as string) || 'Urgent Task';
        setActiveAlarm({
          taskId: (data?.taskId as string) || undefined,
          taskTitle: notifTitle,
          dueTime: (data?.dueTime as string) || undefined,
          notificationId: (data?.notificationId as string) || undefined,
        });
      } else if (data?.type === 'pomodoro') {
        router.push('/screens/pomodoro');
      } else if (data?.type === 'task' || data?.type === 'morning_briefing' || data?.type === 'night_recap') {
        router.push('/screens/notifications');
      }
    });

    // Listen to incoming notifications in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification?.request?.content?.data as Record<string, any> | undefined;
      if (data?.isAlarm || data?.type === 'task_alarm') {
        const notifTitle = (data?.taskTitle as string) || (notification?.request?.content?.title as string) || 'Urgent Task';
        setActiveAlarm({
          taskId: (data?.taskId as string) || undefined,
          taskTitle: notifTitle,
          dueTime: (data?.dueTime as string) || undefined,
          notificationId: (data?.notificationId as string) || undefined,
        });
      }
    });

    return () => {
      responseSubscription.remove();
      foregroundSubscription.remove();
    };
  }, [router]);

  const handleDismissAlarm = () => {
    if (activeAlarm?.notificationId) {
      cancelTaskReminder(activeAlarm.notificationId).catch(() => {});
    }
    setActiveAlarm(null);
  };

  const handleCompleteAlarm = async () => {
    const uid = auth.currentUser?.uid;
    if (uid && activeAlarm?.taskId) {
      await taskService.toggleTaskCompleted(
        uid,
        activeAlarm.taskId,
        false,
        activeAlarm.notificationId
      ).catch(() => {});
    } else if (activeAlarm?.notificationId) {
      cancelTaskReminder(activeAlarm.notificationId).catch(() => {});
    }
    setActiveAlarm(null);
  };

  const handleSnoozeAlarm = async () => {
    if (activeAlarm?.taskTitle) {
      await scheduleSnoozeAlarm({
        taskId: activeAlarm.taskId,
        taskTitle: activeAlarm.taskTitle,
        minutes: 5,
      }).catch(() => {});
    }
    if (activeAlarm?.notificationId) {
      cancelTaskReminder(activeAlarm.notificationId).catch(() => {});
    }
    setActiveAlarm(null);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <NetworkProvider>
            <SecurityProvider>
              <AuthProvider>
                <OfflineBanner />
                <AppUpdateModal />
                <TaskAlarmModal
                  visible={!!activeAlarm}
                  taskId={activeAlarm?.taskId}
                  taskTitle={activeAlarm?.taskTitle || ''}
                  dueTime={activeAlarm?.dueTime}
                  notificationId={activeAlarm?.notificationId}
                  onDismiss={handleDismissAlarm}
                  onComplete={handleCompleteAlarm}
                  onSnooze={handleSnoozeAlarm}
                />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="screens" options={{ headerShown: false }} />
                </Stack>
              </AuthProvider>
            </SecurityProvider>
          </NetworkProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);

