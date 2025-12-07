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
