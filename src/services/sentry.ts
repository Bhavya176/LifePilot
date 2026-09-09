import * as Sentry from '@sentry/react-native';
import { Alert } from 'react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry SDK for LifePilot
 * Call this as early as possible in the app lifecycle (root _layout).
 */
export function initSentry(): void {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
    });
    console.log('[Sentry] Initialized with remote DSN.');
  } else {
    console.log(
      '[Sentry] Initialized in passive mode. Set EXPO_PUBLIC_SENTRY_DSN in .env to stream production events.'
    );
  }
}

/**
 * Error Reporting & Diagnostics Service
 */
export const SentryService = {
  /**
   * Capture non-fatal exceptions and custom application errors
   */
  captureException(error: unknown, context: string = 'General'): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    console.log(`[Sentry Error Logged] Context: ${context} | Message: ${errorObj.message}`);

    if (SENTRY_DSN) {
      Sentry.captureException(errorObj, {
        tags: { context },
        extra: { contextTag: context },
      });
    }
  },

  /**
   * Set or clear the authenticated user context in Sentry
   */
  setUser(userId: string | null, email?: string | null): void {
    if (userId) {
      console.log(`[Sentry User Context] Set user: ${userId}`);
      if (SENTRY_DSN) {
        Sentry.setUser({
          id: userId,
          email: email || undefined,
        });
      }
    } else {
      console.log('[Sentry User Context] Cleared user session');
      if (SENTRY_DSN) {
        Sentry.setUser(null);
      }
    }
  },

  /**
   * Record a diagnostic breadcrumb
   */
  addBreadcrumb(message: string, category: string = 'ui.action', data?: Record<string, unknown>): void {
    console.log(`[Sentry Breadcrumb] [${category}] ${message}`);
    if (SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    }
  },

  /**
   * Development & diagnostics test mechanism
   */
  generateTestCrash(): void {
    const testError = new Error('Test Sentry Event from LifePilot Diagnostic Panel');
    SentryService.captureException(testError, 'Settings Screen Manual Test');

    if (SENTRY_DSN) {
      Alert.alert(
        'Sentry Test Event Sent',
        'A test exception was captured and transmitted to your Sentry dashboard!'
      );
    } else {
      Alert.alert(
        'Sentry Active (Local Mode)',
        'Sentry captured the test exception locally. To transmit live events to sentry.io, provide your EXPO_PUBLIC_SENTRY_DSN in .env.'
      );
    }
  },
};
