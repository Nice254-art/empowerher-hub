-- Fix search path for update_fitness_level function
CREATE OR REPLACE FUNCTION public.update_fitness_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_minutes INTEGER;
  new_level fitness_level;
BEGIN
  SELECT SUM(minutes) INTO total_minutes
  FROM public.workouts
  WHERE user_id = NEW.user_id;
  
  IF total_minutes < 300 THEN
    new_level := 'beginner';
  ELSIF total_minutes < 900 THEN
    new_level := 'intermediate';
  ELSE
    new_level := 'advanced';
  END IF;
  
  UPDATE public.profiles
  SET total_workout_minutes = total_minutes,
      fitness_level = new_level
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;