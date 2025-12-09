import { supabase } from './supabase';
import { 
  Habit, 
  HabitCompletion, 
  UserStats, 
  Achievement,
  Profile,
  Friendship,
  PublicProfile,
  UserSearchResult,
  FriendWithProfile,
} from '@/types/database';
import { logger } from './logger';

// =============================================
// HABITS
// =============================================
export const habitService = {
  async getAll(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
    return data || [];
  },

  async create(userId: string, habit: {
    name: string;
    icon: string;
    frequency: 'daily' | 'weekly';
    points: number;
  }): Promise<Habit | null> {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        ...habit,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      return null;
    }
    return data;
  },

  async update(habitId: string, updates: Partial<Habit>): Promise<boolean> {
    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId);

    if (error) {
      console.error('Error updating habit:', error);
      return false;
    }
    return true;
  },

  async delete(habitId: string): Promise<boolean> {
    // Soft delete - just mark as inactive
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId);

    if (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
    return true;
  },

  async updateStreak(habitId: string, streak: number): Promise<boolean> {
    const { error } = await supabase
      .from('habits')
      .update({ streak })
      .eq('id', habitId);

    if (error) {
      console.error('Error updating streak:', error);
      return false;
    }
    return true;
  },
};

// =============================================
// COMPLETIONS
// =============================================
export const completionService = {
  async getAll(userId: string): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_date', { ascending: false });

    if (error) {
      console.error('Error fetching completions:', error);
      return [];
    }
    return data || [];
  },

  async getByDate(userId: string, date: string): Promise<HabitCompletion[]> {
    logger.log('completionService', 'getByDate called', { userId, date });
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed_date', date);

    if (error) {
      logger.error('completionService', 'Error fetching completions by date', error);
      console.error('Error fetching completions by date:', error);
      return [];
    }
    
    logger.log('completionService', 'getByDate result', { 
      date, 
      count: data?.length || 0,
      completions: data?.map(c => ({ 
        id: c.id, 
        habit_id: c.habit_id, 
        completed_date: c.completed_date, 
        completed: c.completed 
      }))
    });
    
    return data || [];
  },

  async toggle(
    userId: string, 
    habitId: string, 
    date: string, 
    completed: boolean
  ): Promise<boolean> {
    logger.log('completionService', 'toggle called', { 
      userId, 
      habitId, 
      date, 
      completed 
    });
    
    // Check if completion exists
    const { data: existing, error: checkError } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .eq('completed_date', date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('completionService', 'Error checking existing completion', checkError);
    }

    if (existing) {
      logger.log('completionService', 'Updating existing completion', { 
        completionId: existing.id 
      });
      // Update existing
      const { error } = await supabase
        .from('habit_completions')
        .update({ completed })
        .eq('id', existing.id);

      if (error) {
        logger.error('completionService', 'Error updating completion', error);
        console.error('Error updating completion:', error);
        return false;
      }
      logger.log('completionService', 'Completion updated successfully');
    } else {
      logger.log('completionService', 'Creating new completion');
      // Create new
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          user_id: userId,
          habit_id: habitId,
          completed_date: date,
          completed,
        });

      if (error) {
        logger.error('completionService', 'Error creating completion', error);
        console.error('Error creating completion:', error);
        return false;
      }
      logger.log('completionService', 'Completion created successfully');
    }

    return true;
  },

  async getLast7Days(userId: string): Promise<HabitCompletion[]> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_date', weekAgo.toISOString().split('T')[0])
      .lte('completed_date', today.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching last 7 days:', error);
      return [];
    }
    return data || [];
  },

  async checkAllCompletedToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const habits = await habitService.getAll(userId);
    const completions = await this.getByDate(userId, today);
    
    const completedIds = new Set(
      completions.filter(c => c.completed).map(c => c.habit_id)
    );
    
    return habits.every(h => completedIds.has(h.id));
  },
};

// =============================================
// STATS
// =============================================
export const statsService = {
  async get(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
    return data;
  },

  async update(userId: string, updates: {
    level?: number;
    xp?: number;
    xp_to_next_level?: number;
    total_points?: number;
    total_habits_completed?: number;
  }): Promise<boolean> {
    const { error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating stats:', error);
      return false;
    }
    return true;
  },

  async addXP(userId: string, points: number): Promise<{
    levelUp: boolean;
    newLevel: number;
    newXp: number;
  } | null> {
    const stats = await this.get(userId);
    if (!stats) return null;

    let newXp = stats.xp + points;
    let newLevel = stats.level;
    let xpToNextLevel = stats.xp_to_next_level;
    let levelUp = false;

    // Check for level up
    while (newXp >= xpToNextLevel) {
      newXp -= xpToNextLevel;
      newLevel++;
      xpToNextLevel += 100; // Increase XP needed each level
      levelUp = true;
    }

    await this.update(userId, {
      xp: newXp,
      level: newLevel,
      xp_to_next_level: xpToNextLevel,
      total_points: stats.total_points + points,
      total_habits_completed: stats.total_habits_completed + 1,
    });

    return { levelUp, newLevel, newXp };
  },

  async removeXP(userId: string, points: number): Promise<boolean> {
    const stats = await this.get(userId);
    if (!stats) return false;

    return this.update(userId, {
      xp: Math.max(0, stats.xp - points),
      total_points: Math.max(0, stats.total_points - points),
      total_habits_completed: Math.max(0, stats.total_habits_completed - 1),
    });
  },
};

// =============================================
// STREAK (OFENSIVA)
// =============================================
export const streakService = {
  async check(userId: string): Promise<{
    streakBroken: boolean;
    oldStreak: number;
    currentStreak: number;
    longestStreak: number;
  } | null> {
    logger.log('streakService', 'check called', { userId });
    // Call the database function
    const { data, error } = await supabase
      .rpc('check_and_update_streak', { p_user_id: userId });

    if (error) {
      logger.error('streakService', 'Error checking streak', error);
      console.error('Error checking streak:', error);
      return null;
    }

    const result = {
      streakBroken: data?.streak_broken || false,
      oldStreak: data?.old_streak || 0,
      currentStreak: data?.current_streak || data?.new_streak || 0,
      longestStreak: data?.longest_streak || 0,
    };
    
    logger.log('streakService', 'check result', result);
    return result;
  },

  async getProfile(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching streak profile:', error);
      return null;
    }

    return {
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastActivityDate: data.last_activity_date,
    };
  },
};

// =============================================
// ACHIEVEMENTS
// =============================================
export const achievementService = {
  async getAll(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('requirement', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
    return data || [];
  },

  async unlock(achievementId: string): Promise<boolean> {
    const { error } = await supabase
      .from('achievements')
      .update({ unlocked_at: new Date().toISOString() })
      .eq('id', achievementId);

    if (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
    return true;
  },

  async checkAndUnlock(
    userId: string,
    stats: UserStats,
    habits: Habit[],
    friendCount: number = 0
  ): Promise<Achievement[]> {
    const achievements = await this.getAll(userId);
    const profile = await streakService.getProfile(userId);
    const unlockedNow: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.unlocked_at) continue;

      let shouldUnlock = false;

      switch (achievement.achievement_type) {
        case 'total_habits':
          shouldUnlock = stats.total_habits_completed >= achievement.requirement;
          break;
        case 'streak':
          shouldUnlock = (profile?.currentStreak || 0) >= achievement.requirement;
          break;
        case 'level':
          shouldUnlock = stats.level >= achievement.requirement;
          break;
        case 'social':
          shouldUnlock = friendCount >= achievement.requirement;
          break;
      }

      if (shouldUnlock) {
        const success = await this.unlock(achievement.id);
        if (success) {
          unlockedNow.push({
            ...achievement,
            unlocked_at: new Date().toISOString(),
          });
        }
      }
    }

    return unlockedNow;
  },
};

// =============================================
// FRIENDS
// =============================================
export const friendService = {
  async search(searchTerm: string, currentUserId: string): Promise<UserSearchResult[]> {
    const { data, error } = await supabase
      .rpc('search_users', { 
        search_term: searchTerm, 
        current_user_id: currentUserId 
      });

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }
    return data || [];
  },

  async sendRequest(requesterId: string, addresseeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      });

    if (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
    return true;
  },

  async acceptRequest(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
    return true;
  },

  async rejectRequest(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
    return true;
  },

  async removeFriend(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error removing friend:', error);
      return false;
    }
    return true;
  },

  async getFriends(userId: string): Promise<FriendWithProfile[]> {
    // Get friendships where user is either requester or addressee and status is accepted
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        requester:profiles!friendships_requester_id_fkey(id, name, username, avatar_url, current_streak),
        addressee:profiles!friendships_addressee_id_fkey(id, name, username, avatar_url, current_streak)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    // Get stats for all friends
    const friendIds = (data || []).map(f => 
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    const { data: statsData } = await supabase
      .from('user_stats')
      .select('user_id, level')
      .in('user_id', friendIds);

    const statsMap = new Map(
      (statsData || []).map(s => [s.user_id, s.level])
    );

    return (data || []).map(f => {
      const isRequester = f.requester_id === userId;
      const friend = isRequester ? f.addressee : f.requester;
      const friendId = isRequester ? f.addressee_id : f.requester_id;
      
      return {
        friendship_id: f.id,
        friend_id: friendId,
        name: (friend as any)?.name || '',
        username: (friend as any)?.username || null,
        avatar_url: (friend as any)?.avatar_url || null,
        current_streak: (friend as any)?.current_streak || 0,
        level: statsMap.get(friendId) || 1,
        status: f.status as 'pending' | 'accepted',
        is_requester: isRequester,
      };
    });
  },

  async getPendingRequests(userId: string): Promise<FriendWithProfile[]> {
    // Get pending requests where user is the addressee (received requests)
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        requester:profiles!friendships_requester_id_fkey(id, name, username, avatar_url, current_streak)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }

    // Get stats for requesters
    const requesterIds = (data || []).map(f => f.requester_id);

    const { data: statsData } = await supabase
      .from('user_stats')
      .select('user_id, level')
      .in('user_id', requesterIds);

    const statsMap = new Map(
      (statsData || []).map(s => [s.user_id, s.level])
    );

    return (data || []).map(f => ({
      friendship_id: f.id,
      friend_id: f.requester_id,
      name: (f.requester as any)?.name || '',
      username: (f.requester as any)?.username || null,
      avatar_url: (f.requester as any)?.avatar_url || null,
      current_streak: (f.requester as any)?.current_streak || 0,
      level: statsMap.get(f.requester_id) || 1,
      status: 'pending' as const,
      is_requester: false,
    }));
  },

  async getFriendCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error counting friends:', error);
      return 0;
    }
    return count || 0;
  },
};

// =============================================
// PROFILE
// =============================================
export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async getByUsername(username: string): Promise<PublicProfile | null> {
    const { data, error } = await supabase
      .rpc('get_public_profile', { p_username: username });

    if (error || !data || data.length === 0) {
      console.error('Error fetching public profile:', error);
      return null;
    }
    return data[0];
  },

  async update(userId: string, updates: {
    name?: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    is_public?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    // If updating username, check if it's unique
    if (updates.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', userId)
        .single();

      if (existing) {
        return { success: false, error: 'Username já está em uso' };
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async checkUsernameAvailable(username: string, currentUserId: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', currentUserId)
      .single();

    return !data;
  },
};

// =============================================
// LEGACY EXPORT (for backwards compatibility)
// =============================================
export const storage = {
  getHabits: habitService.getAll,
  getCompletions: completionService.getAll,
  addCompletion: completionService.toggle,
  getStats: statsService.get,
  getAchievements: achievementService.getAll,
};
