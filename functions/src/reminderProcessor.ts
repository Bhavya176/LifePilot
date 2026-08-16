import * as admin from 'firebase-admin';

/**
 * Process scheduled reminders and dispatch push notifications via Firebase Admin Messaging.
 */
export async function processScheduledReminders(): Promise<{ processedCount: number }> {
  const db = admin.firestore();
  const messaging = admin.messaging();
  const todayStr = new Date().toISOString().split('T')[0];

  const usersSnap = await db.collection('users').get();
  let processedCount = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) continue;

    // Check pending tasks for today with reminder enabled
    const tasksSnap = await db
      .collection('users')
      .doc(userId)
      .collection('tasks')
      .where('dueDate', '==', todayStr)
      .where('reminder', '==', true)
      .where('completed', '==', false)
      .get();

    if (!tasksSnap.empty) {
      const pendingCount = tasksSnap.size;
      const message = {
        notification: {
          title: '📋 LifePilot Task Reminder',
          body: `You have ${pendingCount} pending task(s) remaining for today.`,
        },
        token: fcmToken,
      };

      try {
        await messaging.send(message);
        processedCount++;
      } catch (err) {
        console.warn(`Failed to send FCM reminder to user ${userId}:`, err);
      }
    }
  }

  return { processedCount };
}
