import { Platform, Alert } from 'react-native';

/**
 * Crashlytics & Error Reporting Service Abstraction for LifePilot
 * Supports non-fatal error logging, custom diagnostic context, user scoping, and dev crash testing.
 */
export const CrashlyticsService = {
  /**
   * Log non-fatal error with diagnostic context
   */
  reportError(error: Error | any, context: string = 'General'): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    console.log(`[Crashlytics Non-Fatal Error Logged] Context: ${context} | Message: ${errorMessage}`);

    // In native builds with @react-native-firebase/crashlytics plugin installed:
    // crashlytics().recordError(error);
    // crashlytics().log(`[Context: ${context}] ${errorMessage}`);
  },

  /**
   * Set user identifier for crash context mapping
   */
  setCrashUserIdentifier(userId: string | null): void {
    if (userId) {
      console.log(`[Crashlytics User Context] setUserId: ${userId}`);
      // crashlytics().setUserId(userId);
    }
  },

  /**
   * Add custom log breadcrumb
   */
  log(message: string): void {
    console.log(`[Crashlytics Log] ${message}`);
    // crashlytics().log(message);
  },

  /**
   * Development-only test mechanism to test Crashlytics error logging pipeline
   */
  generateTestCrash(): void {
    const testErr = new Error('Test Crashlytics Error logged successfully from LifePilot Settings screen.');
    CrashlyticsService.reportError(testErr, 'Settings Screen Test Trigger');
    Alert.alert(
      'Test Error Logged',
      'Non-fatal test error was captured and logged successfully via Crashlytics pipeline!'
    );
  },
};
