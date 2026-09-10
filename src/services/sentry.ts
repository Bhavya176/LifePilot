import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * React Navigation instrumentation instance for Expo Router.
 * Must be registered with Expo Router's root navigation container.
 */
export const routingInstrumentation = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

/**
 * Initialize Sentry SDK for LifePilot.
 * Call this as early as possible in the app lifecycle (root _layout).
 */
export function initSentry(): void {
  const isConfigured = Boolean(SENTRY_DSN && SENTRY_DSN.trim().length > 0);
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber =
    Constants.expoConfig?.android?.versionCode?.toString() ||
    Constants.expoConfig?.ios?.buildNumber ||
    '1';

  Sentry.init({
    dsn: isConfigured ? SENTRY_DSN : undefined,
    enabled: isConfigured,
    tracesSampleRate: 1.0,
    environment: __DEV__ ? 'development' : 'production',
    release: `lifepilot@${appVersion}`,
    dist: buildNumber,
    debug: false,
    enableAutoSessionTracking: true,
    enableCaptureFailedRequests: true,
    integrations: [routingInstrumentation],
  });

  // Tag Scope with Expo Updates (OTA) metadata per Expo SDK 57 docs
  try {
    const scope = Sentry.getGlobalScope();
    const manifest = Updates.manifest;
    const metadata = manifest && 'metadata' in manifest ? (manifest as any).metadata : undefined;
    const extra = manifest && 'extra' in manifest ? (manifest as any).extra : undefined;
    const updateGroup = metadata && 'updateGroup' in metadata ? metadata.updateGroup : undefined;

    if (Updates.updateId) {
      scope.setTag('expo-update-id', Updates.updateId);
    }
    scope.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));

    if (typeof updateGroup === 'string') {
      scope.setTag('expo-update-group-id', updateGroup);
      const owner = extra?.expoClient?.owner ?? 'bhavya17';
      const slug = extra?.expoClient?.slug ?? 'LifePilot';
      scope.setTag(
        'expo-update-debug-url',
        `https://expo.dev/accounts/${owner}/projects/${slug}/updates/${updateGroup}`
      );
    } else if (Updates.isEmbeddedLaunch) {
      scope.setTag('expo-update-debug-url', 'not applicable for embedded updates');
    }
  } catch (e) {
    console.warn('[Sentry] Could not tag OTA update metadata:', e);
  }

  if (isConfigured) {
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
  captureException(
    error: unknown,
    context: string = 'General',
    extra?: Record<string, unknown>
  ): string | undefined {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    console.log(`[Sentry Error Logged] Context: ${context} | Message: ${errorObj.message}`);

    return Sentry.captureException(errorObj, {
      tags: { context },
      extra: {
        contextTag: context,
        ...extra,
      },
    });
  },

  /**
   * Capture informational, warning, or diagnostic messages
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context: string = 'General',
    extra?: Record<string, unknown>
  ): string | undefined {
    console.log(`[Sentry Message Logged] [${level.toUpperCase()}] Context: ${context} | ${message}`);

    return Sentry.captureMessage(message, {
      level,
      tags: { context },
      extra: {
        contextTag: context,
        ...extra,
      },
    });
  },

  /**
   * Set or clear the authenticated user context in Sentry
   */
  setUser(userId: string | null, email?: string | null, username?: string | null): void {
    if (userId) {
      console.log(`[Sentry User Context] Set user: ${userId} (${username || email || 'Anonymous'})`);
      Sentry.setUser({
        id: userId,
        email: email || undefined,
        username: username || undefined,
      });
    } else {
      console.log('[Sentry User Context] Cleared user session');
      Sentry.setUser(null);
    }
  },

  /**
   * Record a diagnostic breadcrumb
   */
  addBreadcrumb(
    message: string,
    category: string = 'ui.action',
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, unknown>
  ): void {
    console.log(`[Sentry Breadcrumb] [${category}] (${level}): ${message}`);
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    });
  },

  /**
   * Set a custom global tag
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  },

  /**
   * Set custom structured context
   */
  setContext(name: string, context: Record<string, unknown> | null): void {
    Sentry.setContext(name, context);
  },

  /**
   * Inspect current Sentry configuration and runtime status
   */
  getSentryStatus(): {
    isConfigured: boolean;
    isOnline: boolean;
    dsnMasked: string;
    environment: string;
    release: string;
    updateId: string;
  } {
    const isConfigured = Boolean(SENTRY_DSN && SENTRY_DSN.trim().length > 0);
    const masked =
      isConfigured && SENTRY_DSN
        ? SENTRY_DSN.replace(/:[^@]+@/, ':***@').replace(/([a-f0-9]{6})[a-f0-9]+(@)/, '$1...$2')
        : 'Not Configured';

    return {
      isConfigured,
      isOnline: isConfigured,
      dsnMasked: masked,
      environment: __DEV__ ? 'development' : 'production',
      release: `lifepilot@${Constants.expoConfig?.version || '1.0.0'}`,
      updateId: Updates.updateId || 'Embedded Base Binary',
    };
  },

  /**
   * Development & diagnostics test mechanism (Handled Exception)
   */
  generateTestCrash(): void {
    const testError = new Error('Test Handled Sentry Event from LifePilot Diagnostic Panel');
    SentryService.addBreadcrumb(
      'User initiated test exception from Diagnostic Panel',
      'diagnostics.test',
      'info',
      { timestamp: new Date().toISOString() }
    );
    const eventId = SentryService.captureException(testError, 'Diagnostic Panel Test', {
      isManualTest: true,
      testedAt: new Date().toISOString(),
    });

    const isConfigured = Boolean(SENTRY_DSN && SENTRY_DSN.trim().length > 0);
    if (isConfigured) {
      Alert.alert(
        'Sentry Test Event Sent 🚀',
        `A test exception was captured and dispatched to Sentry!\n\nEvent ID: ${eventId || 'generated'}`
      );
    } else {
      Alert.alert(
        'Sentry Active (Local Mode)',
        'Sentry captured the test exception locally in passive mode. To stream live events to sentry.io, set EXPO_PUBLIC_SENTRY_DSN in your .env file.'
      );
    }
  },

  /**
   * Development & diagnostics test mechanism (Custom Message)
   */
  generateTestMessage(): void {
    SentryService.addBreadcrumb(
      'User initiated test message from Diagnostic Panel',
      'diagnostics.test',
      'info'
    );
    const eventId = SentryService.captureMessage(
      'Diagnostic Health Check Ping from LifePilot',
      'info',
      'Diagnostic Ping',
      { uptime: Math.round(performance.now() / 1000) }
    );

    Alert.alert(
      'Sentry Ping Captured',
      `Diagnostic info message registered successfully.\n\nEvent ID: ${eventId || 'local-ok'}`
    );
  },

  /**
   * Development & diagnostics test mechanism (Breadcrumb logging)
   */
  generateTestBreadcrumb(): void {
    SentryService.addBreadcrumb(
      'Manual Test Breadcrumb recorded from Diagnostics Suite',
      'user.action',
      'info',
      { trigger: 'manual_button_press', time: Date.now() }
    );
    Alert.alert(
      'Breadcrumb Logged 🍞',
      'A diagnostic breadcrumb was added to your active Sentry session trail.'
    );
  },
};
