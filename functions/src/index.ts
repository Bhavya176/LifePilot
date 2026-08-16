import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateDailySummaryForUser } from './dailySummary';
import { generateWeeklySummaryForUser } from './weeklySummary';
import { processScheduledReminders } from './reminderProcessor';
import { validateExpenseData } from './dataValidation';

admin.initializeApp();

export const generateDailySummary = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = context.auth.uid;
  const dateStr = data.date || new Date().toISOString().split('T')[0];

  return generateDailySummaryForUser(userId, dateStr);
});

export const generateWeeklySummary = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = context.auth.uid;
  const weekStartDate = data.weekStartDate || new Date().toISOString().split('T')[0];

  return generateWeeklySummaryForUser(userId, weekStartDate);
});

export const processRemindersCron = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('UTC')
  .onRun(async (context: functions.EventContext) => {
    console.log('[Cron Job] Processing scheduled daily reminders...');
    const result = await processScheduledReminders();
    console.log(`[Cron Job] Processed ${result.processedCount} reminder notifications.`);
    return null;
  });

export const onExpenseCreated = functions.firestore
  .document('users/{userId}/expenses/{expenseId}')
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data();
    const validation = validateExpenseData(data);
    if (!validation.isValid) {
      console.warn(`Invalid expense data detected at ${snap.ref.path}:`, validation.reason);
    }
  });
