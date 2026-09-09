import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '../services/notificationService';
import { registerForPushNotificationsAsync, scheduleLocalReminder } from '../firebase/messaging';
import { updateUserDoc } from '../firebase/firestore';
import { AppNotification, NotificationType } from '../types/notification';

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.uid;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Register push notification token on login
    registerForPushNotificationsAsync(userId).then(async (token) => {
      if (token) {
        setFcmToken(token);
        await updateUserDoc(userId, { fcmToken: token }).catch(() => null);
      }
    });

    const unsubscribe = notificationService.subscribeUserNotifications(userId, (fetched) => {
      setNotifications(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markRead = async (id: string) => {
    if (!user) return;
    return notificationService.markAsRead(user.uid, id);
  };

  const removeNotif = async (id: string) => {
    if (!user) return;
    return notificationService.deleteNotification(user.uid, id);
  };

  const triggerTestReminder = async (title: string, body: string, type: NotificationType = 'task') => {
    if (!user) return;
    await scheduleLocalReminder(title, body, 3);
    await notificationService.createNotification(user.uid, { title, body, type });
  };

  return {
    notifications,
    loading,
    fcmToken,
    markRead,
    removeNotif,
    triggerTestReminder,
  };
}
