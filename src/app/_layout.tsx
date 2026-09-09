import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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
import { initSentry } from '../services/sentry';

// Initialize Sentry error reporting before mounting component tree
initSentry();

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    // Asynchronously initialize App Check and Remote Config
    initAppCheck().catch(() => {});
    initRemoteConfig().catch(() => {});
  }, []);

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

