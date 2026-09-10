import * as Crypto from 'expo-crypto';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  CustomProvider,
  AppCheck,
} from 'firebase/app-check';
import { app } from './config';
import { Platform } from 'react-native';

// Polyfill global.crypto for React Native / Hermes environment if missing
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    getRandomValues: (array: Uint8Array) => Crypto.getRandomValues(array),
  };
}

let appCheckInstance: AppCheck | null = null;

export interface AppCheckStatus {
  isInitialized: boolean;
  providerName: string;
  isDevelopmentMode: boolean;
}

/**
 * Initialize Firebase App Check to protect backend resources from unauthorized API abuse.
 * Separates Development/Debug configuration from Production configuration.
 */
export async function initAppCheck(): Promise<AppCheckStatus> {
  const isDev = __DEV__;
  let providerName = 'Unenforced / Not configured';

  try {
    const debugToken = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN;
    const recaptchaKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;

    if (Platform.OS === 'web') {
      if (!recaptchaKey || recaptchaKey.includes('DemoKey')) {
        return {
          isInitialized: false,
          providerName: 'Not configured (Missing RECAPTCHA_SITE_KEY)',
          isDevelopmentMode: isDev,
        };
      }
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
      providerName = 'ReCAPTCHA v3 Provider';
    } else if (debugToken && !debugToken.includes('A1B2C3D4')) {
      // Native debug token provider (only when explicitly provided with a registered token)
      (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => ({
            token: debugToken,
            expireTimeMillis: Date.now() + 3600 * 1000,
          }),
        }),
        isTokenAutoRefreshEnabled: true,
      });
      providerName = 'Debug Provider (Registered Token)';
    } else {
      // Avoid passing fake dummy tokens to Firebase which cause HTTP 403 fetch-status-error
      return {
        isInitialized: false,
        providerName: 'Unenforced / Not configured',
        isDevelopmentMode: isDev,
      };
    }

    console.log(`[Firebase App Check] Initialized with ${providerName}`);
  } catch (error) {
    console.warn('[Firebase App Check] Initialization warning:', error);
  }

  return {
    isInitialized: Boolean(appCheckInstance),
    providerName,
    isDevelopmentMode: isDev,
  };
}

export function getAppCheckStatus(): AppCheckStatus {
  return {
    isInitialized: Boolean(appCheckInstance),
    providerName: Platform.OS === 'web' ? 'ReCAPTCHA v3' : __DEV__ ? 'Debug Provider' : 'Play Integrity / DeviceCheck',
    isDevelopmentMode: __DEV__,
  };
}
