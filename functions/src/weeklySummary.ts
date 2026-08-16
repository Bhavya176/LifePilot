import * as admin from 'firebase-admin';

export async function generateWeeklySummaryForUser(userId: string, weekStartDate: string): Promise<any> {
  const db = admin.firestore();

  const summariesSnap = await db
    .collection('users')
    .doc(userId)
    .collection('dailySummaries')
    .limit(7)
    .get();

  let totalTasksCompleted = 0;
  let totalHabitsCompleted = 0;
  let totalExpenses = 0;

  summariesSnap.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    totalTasksCompleted += Number(data.tasksCompleted || 0);
    totalHabitsCompleted += Number(data.habitsCompleted || 0);
    totalExpenses += Number(data.totalExpense || 0);
  });

  const weeklyData = {
    weekStartDate,
    userId,
    tasksCompleted: totalTasksCompleted,
    habitsCompleted: totalHabitsCompleted,
    totalExpenses,
    topCategory: 'Work',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db
    .collection('users')
    .doc(userId)
    .collection('weeklySummaries')
    .doc(weekStartDate)
    .set(weeklyData, { merge: true });

  return weeklyData;
}
