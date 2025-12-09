// Re-export from database types for backwards compatibility
export type { Habit, UserStats } from './database';

// Extended habit type with UI state
export interface HabitWithCompletion {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly';
  points: number;
  streak: number;
  created_at: string;
  updated_at: string;
  completedToday: boolean;
}

// Stats with camelCase for UI (mapped from snake_case)
export interface UserStatsUI {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPoints: number;
  longestStreak: number;
}

// Helper to convert DB stats to UI stats
export const mapStatsToUI = (
  stats: {
    level: number;
    xp: number;
    xp_to_next_level: number;
    total_points: number;
  } | null,
  longestStreak: number = 0
): UserStatsUI => {
  if (!stats) {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalPoints: 0,
      longestStreak,
    };
  }
  return {
    level: stats.level,
    xp: stats.xp,
    xpToNextLevel: stats.xp_to_next_level,
    totalPoints: stats.total_points,
    longestStreak,
  };
};
