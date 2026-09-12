import React, { useEffect } from 'react';
import { Stack, useNavigationContainerRef, useRouter } from 'expo-router';
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

// Initialize Sentry error reporting before mounting component tree
initSentry();

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  const router = useRouter();

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

    // Listen to notification interactions when user taps banner
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.type === 'pomodoro') {
        router.push('/screens/pomodoro');
      } else if (data?.type === 'task' || data?.type === 'morning_briefing' || data?.type === 'night_recap') {
        router.push('/screens/notifications');
      }
    });

    return () => {
      notificationSubscription.remove();
    };
  }, [router]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkProvider>
          <SecurityProvider>
            <AuthProvider>
              <OfflineBanner />
              <AppUpdateModal />
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
  );
}

export default Sentry.wrap(RootLayout);

