export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  profileImage?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  fcmToken?: string;
  notificationPreferences?: {
    taskReminders: boolean;
    habitReminders: boolean;
    goalReminders: boolean;
    dailySummary: boolean;
    documentReminders: boolean;
    weeklySummary: boolean;
  };
}
