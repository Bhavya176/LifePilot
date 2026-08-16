/** XP awarded for each type of action */
export const XP_REWARDS = {
  COMPLETE_TASK: 10,
  CREATE_TASK: 3,
  COMPLETE_HABIT: 15,
  HABIT_STREAK_7: 50,
  HABIT_STREAK_30: 200,
  LOG_EXPENSE: 5,
  GOAL_50_PERCENT: 75,
  GOAL_100_PERCENT: 200,
  CREATE_NOTE: 5,
  DAILY_LOGIN: 10,
  FOCUS_SESSION: 20,
  CHAT_MESSAGE: 2,
} as const;

export type XPAction = keyof typeof XP_REWARDS;

/** Level thresholds and titles */
export interface UserLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  emoji: string;
}

export const LEVEL_TIERS: UserLevel[] = [
  { level: 1, title: 'Beginner', minXP: 0, maxXP: 99, emoji: '🌱' },
  { level: 2, title: 'Learner', minXP: 100, maxXP: 249, emoji: '📘' },
  { level: 3, title: 'Explorer', minXP: 250, maxXP: 499, emoji: '🧭' },
  { level: 4, title: 'Achiever', minXP: 500, maxXP: 999, emoji: '⭐' },
  { level: 5, title: 'Hustler', minXP: 1000, maxXP: 1999, emoji: '🔥' },
  { level: 6, title: 'Go-Getter', minXP: 2000, maxXP: 3499, emoji: '🚀' },
  { level: 7, title: 'Champion', minXP: 3500, maxXP: 5499, emoji: '🏅' },
  { level: 8, title: 'Pro', minXP: 5500, maxXP: 7999, emoji: '💎' },
  { level: 9, title: 'Legend', minXP: 8000, maxXP: 11999, emoji: '👑' },
  { level: 10, title: 'Productivity Master', minXP: 12000, maxXP: Infinity, emoji: '🏆' },
];

/** Achievement badge definitions */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  condition: string; // human-readable
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', title: 'First Step', description: 'Complete your very first task', emoji: '✅', condition: 'Complete 1 task' },
  { id: 'task_10', title: 'Task Terminator', description: 'Complete 10 tasks', emoji: '🎯', condition: 'Complete 10 tasks' },
  { id: 'task_50', title: 'Productivity Machine', description: 'Complete 50 tasks', emoji: '⚡', condition: 'Complete 50 tasks' },
  { id: 'task_100', title: 'Century Club', description: 'Complete 100 tasks', emoji: '💯', condition: 'Complete 100 tasks' },
  { id: 'streak_7', title: 'Weekly Warrior', description: 'Maintain a 7-day habit streak', emoji: '🔥', condition: '7-day streak' },
  { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day habit streak', emoji: '🏆', condition: '30-day streak' },
  { id: 'zero_spend', title: 'Savings Hero', description: 'Log ₹0 spending for a whole day', emoji: '💰', condition: '₹0 spending day' },
  { id: 'goal_complete', title: 'Dream Achiever', description: 'Complete your first goal at 100%', emoji: '🌟', condition: '1 goal at 100%' },
  { id: 'note_writer', title: 'Thoughtful Writer', description: 'Create 10 notes', emoji: '📝', condition: 'Create 10 notes' },
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a task before 8 AM', emoji: '🌅', condition: 'Task before 8 AM' },
  { id: 'level_5', title: 'Rising Star', description: 'Reach Level 5 (Hustler)', emoji: '⭐', condition: 'Reach Level 5' },
  { id: 'level_10', title: 'Ultimate Master', description: 'Reach Level 10 (Productivity Master)', emoji: '👑', condition: 'Reach Level 10' },
];

/** User's gamification profile stored in Firestore */
export interface GamificationProfile {
  totalXP: number;
  level: number;
  title: string;
  tasksCompleted: number;
  habitsCompleted: number;
  goalsCompleted: number;
  notesCreated: number;
  expensesLogged: number;
  bestStreak: number;
  earnedAchievements: string[]; // achievement IDs
  xpHistory: { action: XPAction; xp: number; date: string }[];
  updatedAt: string;
}

export const DEFAULT_PROFILE: GamificationProfile = {
  totalXP: 0,
  level: 1,
  title: 'Beginner',
  tasksCompleted: 0,
  habitsCompleted: 0,
  goalsCompleted: 0,
  notesCreated: 0,
  expensesLogged: 0,
  bestStreak: 0,
  earnedAchievements: [],
  xpHistory: [],
  updatedAt: new Date().toISOString(),
};

/** Helper: compute level from total XP */
export function getLevelFromXP(totalXP: number): UserLevel {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_TIERS[i].minXP) {
      return LEVEL_TIERS[i];
    }
  }
  return LEVEL_TIERS[0];
}

/** Helper: XP progress within current level (0–1) */
export function getLevelProgress(totalXP: number): number {
  const lvl = getLevelFromXP(totalXP);
  if (lvl.maxXP === Infinity) return 1;
  const xpInLevel = totalXP - lvl.minXP;
  const levelRange = lvl.maxXP - lvl.minXP + 1;
  return Math.min(xpInLevel / levelRange, 1);
}
