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
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
      // @ts-ignore - Supabase type inference issue
      completions: data?.map(c => ({ 
        // @ts-ignore - Supabase type inference issue
        id: c.id, 
        // @ts-ignore - Supabase type inference issue
        habit_id: c.habit_id, 
        // @ts-ignore - Supabase type inference issue
        completed_date: c.completed_date, 
        // @ts-ignore - Supabase type inference issue
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
        // @ts-ignore - Supabase type inference issue
        completionId: (existing as any).id 
      });
      // Update existing
      const { error } = await supabase
        .from('habit_completions')
        // @ts-ignore - Supabase type inference issue
        .update({ completed })
        .eq('id', (existing as any).id);

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
        // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
      .rpc('check_and_update_streak', { p_user_id: userId });

    if (error) {
      logger.error('streakService', 'Error checking streak', error);
      console.error('Error checking streak:', error);
      return null;
    }

    const result = {
      // @ts-ignore - Supabase type inference issue
      streakBroken: data?.streak_broken || false,
      // @ts-ignore - Supabase type inference issue
      oldStreak: data?.old_streak || 0,
      // @ts-ignore - Supabase type inference issue
      currentStreak: data?.current_streak || data?.new_streak || 0,
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
      currentStreak: data.current_streak,
      // @ts-ignore - Supabase type inference issue
      longestStreak: data.longest_streak,
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
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
      // @ts-ignore - Supabase type inference issue
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
    console.log('[sendRequest] Creating request:', { requesterId, addresseeId });
    const { data, error } = await supabase
      .from('friendships')
      // @ts-ignore - Supabase type inference issue
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending' as const,
      })
      .select();

    if (error) {
      console.error('Error sending friend request:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('[sendRequest] Request created successfully:', data);
    return true;
  },

  async acceptRequest(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      // @ts-ignore - Supabase type inference issue
      .update({ status: 'accepted' as const })
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
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    if (!friendships || friendships.length === 0) {
      return [];
    }

    // Get friend IDs
    // @ts-ignore - Supabase type inference issue
    const friendIds = ((friendships || []) as any[]).map((f: any) => 
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    // Fetch profiles for friends
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, current_streak')
      .in('id', friendIds);

    if (profilesError) {
      console.error('Error fetching friend profiles:', profilesError);
      return [];
    }

    // Fetch stats for friends
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('user_id, level')
      .in('user_id', friendIds);

    // @ts-ignore - Supabase type inference issue
    const statsMap = new Map(
      ((statsData || []) as any[]).map((s: any) => [s.user_id, s.level])
    );

    // @ts-ignore - Supabase type inference issue
    const profilesMap = new Map(
      ((profiles || []) as any[]).map((p: any) => [p.id, p])
    );

    // @ts-ignore - Supabase type inference issue
    return ((friendships || []) as any[]).map((f: any) => {
      const isRequester = f.requester_id === userId;
      const friendId = isRequester ? f.addressee_id : f.requester_id;
      const profile = profilesMap.get(friendId);
      
      return {
        friendship_id: f.id,
        friend_id: friendId,
        name: profile?.name || '',
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        current_streak: profile?.current_streak || 0,
        level: statsMap.get(friendId) || 1,
        status: f.status as 'pending' | 'accepted',
        is_requester: isRequester,
      };
    });
  },

  async getPendingRequests(userId: string): Promise<FriendWithProfile[]> {
    // Get pending requests where user is the addressee (received requests)
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('addressee_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!friendships || friendships.length === 0) {
      console.log('[getPendingRequests] No pending requests found for user:', userId);
      return [];
    }

    console.log('[getPendingRequests] User ID:', userId);
    console.log('[getPendingRequests] Raw friendships:', JSON.stringify(friendships, null, 2));

    // Get requester IDs
    // @ts-ignore - Supabase type inference issue
    const requesterIds = friendships.map((f: any) => f.requester_id);

    // Fetch profiles for requesters
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, current_streak')
      .in('id', requesterIds);

    if (profilesError) {
      console.error('Error fetching requester profiles:', profilesError);
      return [];
    }

    // Fetch stats for requesters
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('user_id, level')
      .in('user_id', requesterIds);

    // @ts-ignore - Supabase type inference issue
    const statsMap = new Map(
      ((statsData || []) as any[]).map((s: any) => [s.user_id, s.level])
    );

    // @ts-ignore - Supabase type inference issue
    const profilesMap = new Map(
      ((profiles || []) as any[]).map((p: any) => [p.id, p])
    );

    // @ts-ignore - Supabase type inference issue
    const result = ((friendships || []) as any[]).map((f: any) => {
      const profile = profilesMap.get(f.requester_id);
      return {
        friendship_id: f.id,
        friend_id: f.requester_id,
        name: profile?.name || '',
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        current_streak: profile?.current_streak || 0,
        level: statsMap.get(f.requester_id) || 1,
        status: 'pending' as const,
        is_requester: false,
      };
    });

    console.log('[getPendingRequests] Mapped result:', JSON.stringify(result, null, 2));
    return result;
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
// STREAK PARTNERSHIPS (Parcerias de Ofensiva)
// =============================================
export interface StreakPartnership {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  target_days: number;
  current_streak: number;
  start_date: string | null;
  end_date: string | null;
  last_activity_date: string | null;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnershipWithPartner {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_username: string | null;
  partner_avatar_url: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  target_days: number;
  current_streak: number;
  start_date: string | null;
  end_date: string | null;
  last_activity_date: string | null;
  reminder_enabled: boolean;
  is_user1: boolean;
}

export const partnershipService = {
  /**
   * Criar convite de parceria
   */
  async createInvite(userId: string, friendId: string, targetDays: number = 7): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se já existe parceria ativa ou pendente com essa pessoa
      const existing = await this.getPartnershipBetweenUsers(userId, friendId);
      if (existing && (existing.status === 'pending' || existing.status === 'active')) {
        return { 
          success: false, 
          error: 'Você já tem uma parceria ativa ou pendente com esta pessoa' 
        };
      }

      // Verificar se são amigos
      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
        .eq('status', 'accepted')
        .single();

      if (!friendship) {
        return { 
          success: false, 
          error: 'Você precisa ser amigo desta pessoa para criar uma parceria' 
        };
      }

      // Criar parceria
      const { error } = await supabase
        .from('streak_partnerships')
        // @ts-ignore
        .insert({
          user1_id: userId,
          user2_id: friendId,
          status: 'pending',
          target_days: targetDays,
        });

      if (error) {
        console.error('Error creating partnership:', error);
        return { 
          success: false, 
          error: 'Erro ao criar parceria. Tente novamente.' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating partnership invite:', error);
      return { 
        success: false, 
        error: 'Erro ao criar parceria. Tente novamente.' 
      };
    }
  },

  /**
   * Aceitar convite de parceria
   */
  async acceptInvite(partnershipId: string, userId: string): Promise<boolean> {
    try {
      const { data: partnership, error: fetchError } = await supabase
        .from('streak_partnerships')
        .select('*')
        .eq('id', partnershipId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !partnership) {
        console.error('Partnership not found or not pending');
        return false;
      }

      // Verificar se o usuário é o destinatário
      if (partnership.user2_id !== userId) {
        console.error('User is not the addressee');
        return false;
      }

      // Ativar parceria
      const { error } = await supabase
        .from('streak_partnerships')
        // @ts-ignore
        .update({
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', partnershipId);

      if (error) {
        console.error('Error accepting partnership:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error accepting partnership invite:', error);
      return false;
    }
  },

  /**
   * Rejeitar ou cancelar parceria
   */
  async cancelPartnership(partnershipId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('streak_partnerships')
        // @ts-ignore
        .update({ status: 'cancelled' })
        .eq('id', partnershipId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) {
        console.error('Error cancelling partnership:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error cancelling partnership:', error);
      return false;
    }
  },

  /**
   * Obter parcerias do usuário
   */
  async getUserPartnerships(userId: string): Promise<PartnershipWithPartner[]> {
    try {
      const { data, error } = await supabase
        // @ts-ignore
        .rpc('get_user_partnerships', { p_user_id: userId });

      if (error) {
        console.error('Error fetching partnerships:', error);
        return [];
      }

      return (data || []) as PartnershipWithPartner[];
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      return [];
    }
  },

  /**
   * Obter parceria entre dois usuários
   */
  async getPartnershipBetweenUsers(userId1: string, userId2: string): Promise<StreakPartnership | null> {
    try {
      const { data, error } = await supabase
        .from('streak_partnerships')
        .select('*')
        .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
        .in('status', ['pending', 'active'])
        .single();

      if (error || !data) {
        return null;
      }

      return data as StreakPartnership;
    } catch (error) {
      return null;
    }
  },

  /**
   * Verificar progresso da parceria (chamado quando usuário completa hábitos)
   */
  async checkPartnershipProgress(partnershipId: string): Promise<{
    both_completed: boolean;
    new_streak?: number;
    target_reached?: boolean;
    completed?: boolean;
    user1_completed?: boolean;
    user2_completed?: boolean;
  } | null> {
    try {
      const { data, error } = await supabase
        // @ts-ignore
        .rpc('check_partnership_progress', { p_partnership_id: partnershipId });

      if (error) {
        console.error('Error checking partnership progress:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error checking partnership progress:', error);
      return null;
    }
  },

  /**
   * Atualizar configurações de lembrete
   */
  async updateReminderSettings(partnershipId: string, userId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('streak_partnerships')
        // @ts-ignore
        .update({ reminder_enabled: enabled })
        .eq('id', partnershipId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) {
        console.error('Error updating reminder settings:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      return false;
    }
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
      // @ts-ignore - Supabase type inference issue
      .rpc('get_public_profile', { p_username: username });

    if (error || !data || (data as any).length === 0) {
      console.error('Error fetching public profile:', error);
      return null;
    }
    // @ts-ignore - Supabase type inference issue
    return (data as any)[0];
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
      // @ts-ignore - Supabase type inference issue
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
