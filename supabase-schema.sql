-- =============================================
-- HABITQUEST - SUPABASE SCHEMA v2.0
-- =============================================
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- =============================================
-- 1. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE, -- Apelido único para busca
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true, -- Perfil público/privado
  current_streak INTEGER DEFAULT 0, -- Ofensiva atual
  longest_streak INTEGER DEFAULT 0, -- Maior ofensiva
  last_activity_date DATE, -- Última vez que completou hábitos
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" 
  ON public.profiles FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Index for username search
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_username_search_idx ON public.profiles USING gin(username gin_trgm_ops);

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- 2. HABITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  points INTEGER NOT NULL DEFAULT 10,
  streak INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can create own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;

CREATE POLICY "Users can view own habits" 
  ON public.habits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" 
  ON public.habits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" 
  ON public.habits FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" 
  ON public.habits FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);

-- =============================================
-- 3. HABIT COMPLETIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(habit_id, completed_date)
);

-- Enable RLS
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can create own completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can update own completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can delete own completions" ON public.habit_completions;

CREATE POLICY "Users can view own completions" 
  ON public.habit_completions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions" 
  ON public.habit_completions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" 
  ON public.habit_completions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" 
  ON public.habit_completions FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS completions_user_id_idx ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS completions_habit_id_idx ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS completions_date_idx ON public.habit_completions(completed_date);

-- =============================================
-- 4. USER STATS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_habits_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view friends stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can create own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;

CREATE POLICY "Users can view own stats" 
  ON public.user_stats FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow viewing stats of public profiles
CREATE POLICY "Users can view public stats" 
  ON public.user_stats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = user_stats.user_id 
      AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can create own stats" 
  ON public.user_stats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" 
  ON public.user_stats FOR UPDATE 
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS stats_user_id_idx ON public.user_stats(user_id);

-- =============================================
-- 5. ACHIEVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('streak', 'total_habits', 'level', 'perfect_week', 'social')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_type, requirement)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can create own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON public.achievements;

CREATE POLICY "Users can view own achievements" 
  ON public.achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public achievements" 
  ON public.achievements FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = achievements.user_id 
      AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can create own achievements" 
  ON public.achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" 
  ON public.achievements FOR UPDATE 
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON public.achievements(user_id);

-- =============================================
-- 6. FRIENDSHIPS TABLE (Sistema de Amigos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policies for friendships
CREATE POLICY "Users can view own friendships" 
  ON public.friendships FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests" 
  ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of" 
  ON public.friendships FOR UPDATE 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendships" 
  ON public.friendships FOR DELETE 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Indexes
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS friendships_status_idx ON public.friendships(status);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate username from email
  base_username := lower(split_part(NEW.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');
  final_username := base_username;
  
  -- Check if username exists and add number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  -- Create profile
  INSERT INTO public.profiles (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    final_username
  );
  
  -- Create initial stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  -- Create default achievements
  INSERT INTO public.achievements (user_id, achievement_type, title, description, icon, requirement)
  VALUES
    (NEW.id, 'total_habits', 'Primeira Vitória', 'Complete seu primeiro hábito', '🎯', 1),
    (NEW.id, 'total_habits', 'Dedicado', 'Complete 50 hábitos no total', '💪', 50),
    (NEW.id, 'total_habits', 'Consistente', 'Complete 100 hábitos no total', '🌟', 100),
    (NEW.id, 'streak', 'Sequência de 7', 'Mantenha uma ofensiva de 7 dias', '🔥', 7),
    (NEW.id, 'streak', 'Sequência de 30', 'Mantenha uma ofensiva de 30 dias', '👑', 30),
    (NEW.id, 'streak', 'Centenário', 'Mantenha uma ofensiva de 100 dias', '🏆', 100),
    (NEW.id, 'level', 'Nível 5', 'Alcance o nível 5', '🚀', 5),
    (NEW.id, 'level', 'Nível 10', 'Alcance o nível 10', '💎', 10),
    (NEW.id, 'level', 'Nível 25', 'Alcance o nível 25', '⭐', 25),
    (NEW.id, 'social', 'Sociável', 'Adicione seu primeiro amigo', '🤝', 1),
    (NEW.id, 'social', 'Popular', 'Tenha 10 amigos', '👥', 10);
  
  -- Create default habits
  INSERT INTO public.habits (user_id, name, icon, frequency, points)
  VALUES
    (NEW.id, 'Beber 2L de água', '💧', 'daily', 10),
    (NEW.id, 'Exercício físico', '🏃', 'daily', 10),
    (NEW.id, 'Ler 30 minutos', '📖', 'daily', 10);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON public.user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCTION: Check and update streak
-- =============================================
CREATE OR REPLACE FUNCTION public.check_and_update_streak(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
  v_completed_today BOOLEAN;
  v_completed_yesterday BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get current profile data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if user completed all habits today
  SELECT EXISTS (
    SELECT 1 
    FROM public.habits h
    WHERE h.user_id = p_user_id 
    AND h.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.habit_completions hc
      WHERE hc.habit_id = h.id 
      AND hc.completed_date = v_today
      AND hc.completed = true
    )
  ) INTO v_completed_today;
  v_completed_today := NOT v_completed_today; -- Invert: true if ALL completed

  -- If last activity was before yesterday, streak is broken
  IF v_last_activity IS NOT NULL AND v_last_activity < v_yesterday THEN
    -- Streak broken!
    UPDATE public.profiles
    SET current_streak = CASE WHEN v_completed_today THEN 1 ELSE 0 END,
        last_activity_date = CASE WHEN v_completed_today THEN v_today ELSE v_last_activity END
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
      'streak_broken', true,
      'old_streak', v_current_streak,
      'new_streak', CASE WHEN v_completed_today THEN 1 ELSE 0 END
    );
  ELSIF v_completed_today THEN
    -- Completed today
    IF v_last_activity = v_yesterday OR v_last_activity = v_today THEN
      -- Continue streak
      IF v_last_activity != v_today THEN
        v_current_streak := v_current_streak + 1;
      END IF;
    ELSE
      -- Start new streak
      v_current_streak := 1;
    END IF;
    
    -- Update longest if needed
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    UPDATE public.profiles
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_activity_date = v_today
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
      'streak_broken', false,
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak
    );
  ELSE
    v_result := jsonb_build_object(
      'streak_broken', false,
      'current_streak', v_current_streak,
      'pending_today', true
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Search users by username
-- =============================================
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT, current_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  current_streak INTEGER,
  level INTEGER,
  friendship_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.current_streak,
    COALESCE(us.level, 1) as level,
    CASE 
      WHEN f1.status IS NOT NULL THEN f1.status
      WHEN f2.status IS NOT NULL THEN f2.status
      ELSE NULL
    END as friendship_status
  FROM public.profiles p
  LEFT JOIN public.user_stats us ON us.user_id = p.id
  LEFT JOIN public.friendships f1 ON f1.requester_id = current_user_id AND f1.addressee_id = p.id
  LEFT JOIN public.friendships f2 ON f2.requester_id = p.id AND f2.addressee_id = current_user_id
  WHERE p.is_public = true
    AND p.id != current_user_id
    AND (
      p.username ILIKE '%' || search_term || '%'
      OR p.name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE WHEN p.username ILIKE search_term || '%' THEN 0 ELSE 1 END,
    p.current_streak DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Get user public profile
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_profile(p_username TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  current_streak INTEGER,
  longest_streak INTEGER,
  level INTEGER,
  total_points INTEGER,
  total_habits_completed INTEGER,
  member_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.bio,
    p.current_streak,
    p.longest_streak,
    COALESCE(us.level, 1),
    COALESCE(us.total_points, 0),
    COALESCE(us.total_habits_completed, 0),
    p.created_at as member_since
  FROM public.profiles p
  LEFT JOIN public.user_stats us ON us.user_id = p.id
  WHERE p.username = p_username
    AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
