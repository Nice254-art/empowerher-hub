-- Add Elite level to fitness_level enum
ALTER TYPE fitness_level ADD VALUE IF NOT EXISTS 'elite';

-- Create wearable_data table
CREATE TABLE public.wearable_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER,
  active_minutes INTEGER,
  calories INTEGER,
  heart_rate INTEGER,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_stats table
CREATE TABLE public.weekly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  days_active INTEGER DEFAULT 0,
  total_active_minutes INTEGER DEFAULT 0,
  consistency_score DECIMAL(3,2) DEFAULT 0,
  effort_score DECIMAL(3,2) DEFAULT 0,
  final_score DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create wearable_connections table
CREATE TABLE public.wearable_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Add new fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_score DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_rank INTEGER,
ADD COLUMN IF NOT EXISTS consistency_weeks INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for wearable_data
CREATE POLICY "Users can view their own wearable data"
ON public.wearable_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wearable data"
ON public.wearable_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for weekly_stats
CREATE POLICY "Users can view their own weekly stats"
ON public.weekly_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view weekly stats for leaderboard"
ON public.weekly_stats FOR SELECT
USING (true);

-- RLS policies for wearable_connections
CREATE POLICY "Users can view their own connections"
ON public.wearable_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections"
ON public.wearable_connections FOR ALL
USING (auth.uid() = user_id);

-- Function to calculate weekly scores
CREATE OR REPLACE FUNCTION public.calculate_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  week_start_date DATE;
  week_end_date DATE;
  days_active INTEGER;
  total_minutes INTEGER;
  consistency_score DECIMAL(3,2);
  effort_score DECIMAL(3,2);
  final_score DECIMAL(3,2);
  new_fitness_level fitness_level;
  consistency_weeks INTEGER;
BEGIN
  week_start_date := date_trunc('week', CURRENT_DATE)::DATE;
  week_end_date := week_start_date + INTERVAL '6 days';
  
  FOR user_record IN SELECT id FROM public.profiles LOOP
    -- Count days active this week
    SELECT COUNT(DISTINCT date) INTO days_active
    FROM public.workouts
    WHERE user_id = user_record.id
    AND date >= week_start_date
    AND date <= week_end_date;
    
    -- Sum total minutes this week
    SELECT COALESCE(SUM(minutes), 0) INTO total_minutes
    FROM public.workouts
    WHERE user_id = user_record.id
    AND date >= week_start_date
    AND date <= week_end_date;
    
    -- Calculate scores
    consistency_score := LEAST(days_active::DECIMAL / 7, 1.0);
    effort_score := LEAST(total_minutes::DECIMAL / 300, 1.0);
    final_score := (consistency_score * 0.7) + (effort_score * 0.3);
    
    -- Determine fitness level
    IF days_active >= 5 AND total_minutes >= 420 THEN
      new_fitness_level := 'advanced';
    ELSIF days_active >= 3 AND total_minutes >= 210 THEN
      new_fitness_level := 'intermediate';
    ELSE
      new_fitness_level := 'beginner';
    END IF;
    
    -- Check for Elite status (8+ weeks of advanced performance)
    SELECT COUNT(*) INTO consistency_weeks
    FROM public.weekly_stats
    WHERE user_id = user_record.id
    AND final_score >= 0.8
    AND week_start >= CURRENT_DATE - INTERVAL '8 weeks';
    
    IF consistency_weeks >= 8 THEN
      new_fitness_level := 'elite';
    END IF;
    
    -- Insert or update weekly stats
    INSERT INTO public.weekly_stats (
      user_id, week_start, week_end, days_active, 
      total_active_minutes, consistency_score, effort_score, final_score
    ) VALUES (
      user_record.id, week_start_date, week_end_date, days_active,
      total_minutes, consistency_score, effort_score, final_score
    )
    ON CONFLICT (user_id, week_start) 
    DO UPDATE SET
      days_active = EXCLUDED.days_active,
      total_active_minutes = EXCLUDED.total_active_minutes,
      consistency_score = EXCLUDED.consistency_score,
      effort_score = EXCLUDED.effort_score,
      final_score = EXCLUDED.final_score;
    
    -- Update profile
    UPDATE public.profiles
    SET 
      weekly_score = final_score,
      fitness_level = new_fitness_level,
      consistency_weeks = consistency_weeks
    WHERE id = user_record.id;
  END LOOP;
  
  -- Calculate category ranks
  WITH ranked_users AS (
    SELECT 
      id,
      fitness_level,
      ROW_NUMBER() OVER (PARTITION BY fitness_level ORDER BY weekly_score DESC) as rank
    FROM public.profiles
  )
  UPDATE public.profiles p
  SET category_rank = r.rank
  FROM ranked_users r
  WHERE p.id = r.id;
END;
$$;