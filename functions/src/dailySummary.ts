import * as admin from 'firebase-admin';

export async function generateDailySummaryForUser(userId: string, dateStr: string): Promise<any> {
  const db = admin.firestore();

  const tasksSnap = await db
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .where('dueDate', '==', dateStr)
    .get();

  let tasksCompleted = 0;
  const tasksTotal = tasksSnap.size;
  tasksSnap.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    if (doc.data().completed) tasksCompleted++;
  });

  const habitsSnap = await db
    .collection('users')
    .doc(userId)
    .collection('habits')
    .get();

  let habitsCompleted = 0;
  const habitsTotal = habitsSnap.size;
  habitsSnap.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const completedDates: string[] = doc.data().completedDates || [];
    if (completedDates.includes(dateStr)) habitsCompleted++;
  });

  const expensesSnap = await db
    .collection('users')
    .doc(userId)
    .collection('expenses')
    .where('date', '==', dateStr)
    .get();

  let totalExpense = 0;
  expensesSnap.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    totalExpense += Number(doc.data().amount || 0);
  });

  const taskRatio = tasksTotal > 0 ? tasksCompleted / tasksTotal : 1;
  const habitRatio = habitsTotal > 0 ? habitsCompleted / habitsTotal : 1;
  const productivityScore = Math.round((taskRatio * 0.6 + habitRatio * 0.4) * 100);

  const insight = `Daily Summary for ${dateStr}: Completed ${tasksCompleted}/${tasksTotal} tasks and ${habitsCompleted}/${habitsTotal} habits. Total expenses: $${totalExpense.toFixed(2)}. Score: ${productivityScore}%.`;

  const summaryData = {
    date: dateStr,
    userId,
    tasksCompleted,
    tasksTotal,
    habitsCompleted,
    habitsTotal,
    totalExpense,
    productivityScore,
    aiInsight: insight,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db
    .collection('users')
    .doc(userId)
    .collection('dailySummaries')
    .doc(dateStr)
    .set(summaryData, { merge: true });

  return summaryData;
}
