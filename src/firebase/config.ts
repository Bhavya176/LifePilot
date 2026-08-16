import 'react-native-get-random-values';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is provided by React Native entry of firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration keys (Safe to include in client application code)
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoKeyForLifePilotExpoApp12345',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'lifepilot-demo.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://lifepilot-demo-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'lifepilot-demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'lifepilot-demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:demo123456789',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMO123456',
};

// Initialize or retrieve Firebase App singleton instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize persistent Auth for React Native (AsyncStorage) & Web fallback
let authInstance: Auth;

try {
  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    // React Native persistent auth initialization
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence ? getReactNativePersistence(AsyncStorage) : browserLocalPersistence,
    });
  }
} catch (e) {
  // Fallback if auth is already initialized during Fast Refresh / HMR
  authInstance = getAuth(app);
}

export const auth = authInstance;

/**
 * Diagnostic helper to check current Firebase configuration status
 */
export function checkFirebaseStatus(): {
  isInitialized: boolean;
  projectId: string;
  hasApiKey: boolean;
  platform: string;
} {
  return {
    isInitialized: getApps().length > 0,
    projectId: firebaseConfig.projectId,
    hasApiKey: Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('Demo')),
    platform: Platform.OS,
  };
}
