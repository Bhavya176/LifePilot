import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import {
  GamificationProfile,
  DEFAULT_PROFILE,
  XP_REWARDS,
  XPAction,
  getLevelFromXP,
  ACHIEVEMENTS,
} from '../types/gamification';

const COLLECTION = 'gamification';

/** Get or create user gamification profile */
export async function getGamificationProfile(userId: string): Promise<GamificationProfile> {
  try {
    const ref = doc(db, COLLECTION, userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as GamificationProfile;
    }
    // Create default profile
    const profile = { ...DEFAULT_PROFILE, updatedAt: new Date().toISOString() };
    await setDoc(ref, profile);
    return profile;
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/** Award XP for an action and return updated profile + whether leveled up */
export async function awardXP(
  userId: string,
  action: XPAction,
  currentProfile: GamificationProfile
): Promise<{ profile: GamificationProfile; leveledUp: boolean; newAchievements: string[] }> {
  const xpGain = XP_REWARDS[action];
  const oldLevel = getLevelFromXP(currentProfile.totalXP);
  const newTotalXP = currentProfile.totalXP + xpGain;
  const newLevelData = getLevelFromXP(newTotalXP);
  const leveledUp = newLevelData.level > oldLevel.level;

  // Update stat counters
  const updates: Partial<GamificationProfile> = {
    totalXP: newTotalXP,
    level: newLevelData.level,
    title: newLevelData.title,
    updatedAt: new Date().toISOString(),
  };

  if (action === 'COMPLETE_TASK') updates.tasksCompleted = (currentProfile.tasksCompleted || 0) + 1;
  if (action === 'COMPLETE_HABIT') updates.habitsCompleted = (currentProfile.habitsCompleted || 0) + 1;
  if (action === 'GOAL_100_PERCENT') updates.goalsCompleted = (currentProfile.goalsCompleted || 0) + 1;
  if (action === 'CREATE_NOTE') updates.notesCreated = (currentProfile.notesCreated || 0) + 1;
  if (action === 'LOG_EXPENSE') updates.expensesLogged = (currentProfile.expensesLogged || 0) + 1;

  // Check for new achievements
  const newAchievements: string[] = [];
  const earned = [...(currentProfile.earnedAchievements || [])];
  const updatedProfile = { ...currentProfile, ...updates };

  // Achievement checks
  if (!earned.includes('first_task') && (updatedProfile.tasksCompleted || 0) >= 1) {
    newAchievements.push('first_task');
  }
  if (!earned.includes('task_10') && (updatedProfile.tasksCompleted || 0) >= 10) {
    newAchievements.push('task_10');
  }
  if (!earned.includes('task_50') && (updatedProfile.tasksCompleted || 0) >= 50) {
    newAchievements.push('task_50');
  }
  if (!earned.includes('task_100') && (updatedProfile.tasksCompleted || 0) >= 100) {
    newAchievements.push('task_100');
  }
  if (!earned.includes('goal_complete') && action === 'GOAL_100_PERCENT') {
    newAchievements.push('goal_complete');
  }
  if (!earned.includes('note_writer') && (updatedProfile.notesCreated || 0) >= 10) {
    newAchievements.push('note_writer');
  }
  if (!earned.includes('level_5') && newLevelData.level >= 5) {
    newAchievements.push('level_5');
  }
  if (!earned.includes('level_10') && newLevelData.level >= 10) {
    newAchievements.push('level_10');
  }

  if (newAchievements.length > 0) {
    updates.earnedAchievements = [...earned, ...newAchievements];
  }

  // Save to Firestore
  try {
    const ref = doc(db, COLLECTION, userId);
    await updateDoc(ref, updates).catch(() => setDoc(ref, { ...currentProfile, ...updates }));
  } catch {
    // Silently fail — XP is best-effort
  }

  return {
    profile: { ...currentProfile, ...updates, earnedAchievements: updates.earnedAchievements || earned },
    leveledUp,
    newAchievements,
  };
}

/** Update best streak */
export async function updateBestStreak(userId: string, streak: number, currentProfile: GamificationProfile): Promise<GamificationProfile> {
  if (streak <= (currentProfile.bestStreak || 0)) return currentProfile;

  const updates: Partial<GamificationProfile> = {
    bestStreak: streak,
    updatedAt: new Date().toISOString(),
  };

  const newAchievements: string[] = [];
  const earned = [...(currentProfile.earnedAchievements || [])];

  if (!earned.includes('streak_7') && streak >= 7) newAchievements.push('streak_7');
  if (!earned.includes('streak_30') && streak >= 30) newAchievements.push('streak_30');

  if (newAchievements.length > 0) {
    updates.earnedAchievements = [...earned, ...newAchievements];
  }

  try {
    const ref = doc(db, COLLECTION, userId);
    await updateDoc(ref, updates).catch(() => {});
  } catch {}

  return { ...currentProfile, ...updates, earnedAchievements: updates.earnedAchievements || earned };
}
