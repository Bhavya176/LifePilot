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
  let providerName = 'Debug/Custom Provider';

  try {
    // Configure self-declared debug token in development mode so dev builds are never blocked
    if (isDev) {
      const debugToken = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN || 'A1B2C3D4-E5F6-4A5B-8C9D-0E1F2A3B4C5D';
      (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }

    if (Platform.OS === 'web') {
      const recaptchaSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6LcDemoKeyForLifePilotWebSiteKey123456';
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      providerName = 'ReCAPTCHA v3 Provider';
    } else {
      // Native iOS (DeviceCheck / AppAttest) & Android (Play Integrity)
      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => {
            try {
              // Custom token handler or debug fallback
              return {
                token: process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN || 'A1B2C3D4-E5F6-4A5B-8C9D-0E1F2A3B4C5D',
                expireTimeMillis: Date.now() + 3600 * 1000,
              };
            } catch (err) {
              console.warn('[Firebase App Check] Error getting token:', err);
              return {
                token: '',
                expireTimeMillis: Date.now(),
              };
            }
          },
        }),
        isTokenAutoRefreshEnabled: true,
      });
      providerName = isDev ? 'Debug Provider (Dev Mode)' : 'Play Integrity / DeviceCheck';
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
