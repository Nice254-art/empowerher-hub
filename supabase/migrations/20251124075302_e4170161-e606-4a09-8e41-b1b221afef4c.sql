-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('user', 'mentor', 'admin');

-- Create enum for fitness levels
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create enum for abuse report status
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');

-- Create enum for question topics
CREATE TYPE question_topic AS ENUM ('safety', 'relationships', 'mental_health', 'fitness', 'legal_help', 'other');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  profile_picture_url TEXT,
  fitness_level fitness_level DEFAULT 'beginner',
  total_workout_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can view roles
CREATE POLICY "Users can view roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  minutes INTEGER NOT NULL,
  workout_type TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update fitness level based on workouts
CREATE OR REPLACE FUNCTION public.update_fitness_level()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER update_fitness_level_trigger
  AFTER INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_fitness_level();

-- Abuse reports table
CREATE TABLE public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  evidence_file_url TEXT,
  status report_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.abuse_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON public.abuse_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.abuse_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.abuse_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Anonymous questions table
CREATE TABLE public.anonymous_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  topic question_topic NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.anonymous_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON public.anonymous_questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON public.anonymous_questions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Answers table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.anonymous_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers"
  ON public.answers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create answers"
  ON public.answers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Mentors table
CREATE TABLE public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bio TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  availability TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved mentors"
  ON public.mentors FOR SELECT
  USING (approved = true);

CREATE POLICY "Admins can view all mentors"
  ON public.mentors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create mentor profiles"
  ON public.mentors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update mentors"
  ON public.mentors FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  speaker TEXT,
  meeting_link TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meetings"
  ON public.meetings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage meetings"
  ON public.meetings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  content_url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources"
  ON public.resources FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for evidence and profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false),
       ('profile-pictures', 'profile-pictures', true);

-- Storage policies for evidence
CREATE POLICY "Users can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Storage policies for profile pictures
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile pictures"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );