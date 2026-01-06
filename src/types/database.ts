export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          frequency: 'daily' | 'weekly'
          points: number
          streak: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon: string
          frequency: 'daily' | 'weekly'
          points?: number
          streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          icon?: string
          frequency?: 'daily' | 'weekly'
          points?: number
          streak?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_date: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed_date: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          completed?: boolean
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          level: number
          xp: number
          xp_to_next_level: number
          total_points: number
          total_habits_completed: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level?: number
          xp?: number
          xp_to_next_level?: number
          total_points?: number
          total_habits_completed?: number
          updated_at?: string
        }
        Update: {
          level?: number
          xp?: number
          xp_to_next_level?: number
          total_points?: number
          total_habits_completed?: number
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: 'streak' | 'total_habits' | 'level' | 'perfect_week' | 'social'
          title: string
          description: string
          icon: string
          requirement: number
          unlocked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: 'streak' | 'total_habits' | 'level' | 'perfect_week' | 'social'
          title: string
          description: string
          icon: string
          requirement: number
          unlocked_at?: string | null
          created_at?: string
        }
        Update: {
          unlocked_at?: string | null
        }
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'blocked'
          updated_at?: string
        }
      }
      streak_partnerships: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          status: 'pending' | 'active' | 'completed' | 'cancelled'
          target_days: number
          current_streak: number
          start_date: string | null
          end_date: string | null
          last_activity_date: string | null
          reminder_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          status?: 'pending' | 'active' | 'completed' | 'cancelled'
          target_days?: number
          current_streak?: number
          start_date?: string | null
          end_date?: string | null
          last_activity_date?: string | null
          reminder_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'active' | 'completed' | 'cancelled'
          target_days?: number
          current_streak?: number
          start_date?: string | null
          end_date?: string | null
          last_activity_date?: string | null
          reminder_enabled?: boolean
          updated_at?: string
        }
      }
    }
    Functions: {
      check_and_update_streak: {
        Args: {
          p_user_id: string
        }
        Returns: {
          streak_broken: boolean
          old_streak: number
          new_streak: number
          current_streak: number
          longest_streak: number
        }
      }
      search_users: {
        Args: {
          search_term: string
          current_user_id: string
        }
        Returns: {
          id: string
          name: string
          username: string | null
          avatar_url: string | null
          current_streak: number
          level: number
          friendship_status: 'pending' | 'accepted' | 'blocked' | null
        }[]
      }
      get_public_profile: {
        Args: {
          p_username: string
        }
        Returns: {
          id: string
          name: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          current_streak: number
          longest_streak: number
          level: number
          total_points: number
          total_habits_completed: number
          member_since: string
        }[]
      }
      check_partnership_progress: {
        Args: {
          p_partnership_id: string
        }
        Returns: {
          both_completed: boolean
          new_streak?: number
          target_reached?: boolean
          completed?: boolean
          user1_completed?: boolean
          user2_completed?: boolean
          already_counted?: boolean
          current_streak?: number
          error?: string
        }
      }
      get_user_partnerships: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          partner_id: string
          partner_name: string
          partner_username: string | null
          partner_avatar_url: string | null
          status: 'pending' | 'active' | 'completed' | 'cancelled'
          target_days: number
          current_streak: number
          start_date: string | null
          end_date: string | null
          last_activity_date: string | null
          reminder_enabled: boolean
          is_user1: boolean
        }[]
      }
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];
export type UserStats = Database['public']['Tables']['user_stats']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];

// Extended types for UI
export interface PublicProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  current_streak: number;
  longest_streak: number;
  level: number;
  total_points: number;
  total_habits_completed: number;
  member_since: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  level: number;
  friendship_status: 'pending' | 'accepted' | 'blocked' | null;
}

export interface FriendWithProfile {
  friendship_id: string;
  friend_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  level: number;
  status: 'pending' | 'accepted';
  is_requester: boolean; // true if current user sent the request
}
