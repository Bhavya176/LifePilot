import { getAnalytics, logEvent as firebaseLogEvent, setUserId, isSupported, Analytics } from 'firebase/analytics';
import { app } from './config';
import { Platform } from 'react-native';

let analyticsInstance: Analytics | null = null;

// Initialize Firebase Analytics if supported in current runtime environment
isSupported().then((supported) => {
  if (supported) {
    analyticsInstance = getAnalytics(app);
  }
});

export type AnalyticsEventName =
  | 'app_open'
  | 'sign_up'
  | 'login'
  | 'task_created'
  | 'task_completed'
  | 'habit_created'
  | 'habit_completed'
  | 'note_created'
  | 'expense_added'
  | 'goal_created'
  | 'document_uploaded'
  | 'notification_opened'
  | 'profile_updated';

/**
 * Privacy-focused analytics service abstraction for LifePilot
 */
export const AnalyticsService = {
  logEvent(eventName: AnalyticsEventName, eventParams: Record<string, any> = {}) {
    try {
      console.log(`[Analytics Event] ${eventName}:`, eventParams);
      if (analyticsInstance) {
        firebaseLogEvent(analyticsInstance, eventName as string, eventParams);
      }
    } catch (error) {
      console.warn(`Analytics log failure [${eventName}]:`, error);
    }
  },

  setUserIdentifier(userId: string | null) {
    try {
      if (analyticsInstance && userId) {
        setUserId(analyticsInstance, userId);
      }
    } catch (error) {
      console.warn('Analytics setUserId failure:', error);
    }
  },
};
