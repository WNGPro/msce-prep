-- ============================================================
-- MSCE PREP — Complete Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE subject_type AS ENUM (
    'mathematics', 'english', 'chichewa', 'biology', 'physical_science',
    'chemistry', 'physics', 'geography', 'history', 'agriculture',
    'bible_knowledge', 'social_studies', 'computer_studies', 'life_skills',
    'additional_math', 'home_economics', 'business_studies', 'french'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE paper_type AS ENUM ('msce_official', 'school_paper');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE test_type AS ENUM ('weekly', 'custom', 'paper', 'cross_subject');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE upload_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Tables ───────────────────────────────────────────────────────────────

-- Profiles (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT,
  full_name             TEXT,
  school_name           TEXT,
  subjects              subject_type[] DEFAULT '{}',
  priority_subjects     subject_type[] DEFAULT '{}',
  preferred_test_day    TEXT DEFAULT 'saturday',
  onboarding_completed  BOOLEAN DEFAULT false,
  avatar_preset         TEXT DEFAULT 'book',
  avatar_color          TEXT DEFAULT '#1f3d5d',
  banner_preset         TEXT DEFAULT 'navy-wave',
  avatar_url            TEXT,
  is_premium            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Papers
CREATE TABLE IF NOT EXISTS papers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  subject      subject_type NOT NULL,
  year         INTEGER NOT NULL,
  paper_type   paper_type NOT NULL DEFAULT 'msce_official',
  file_url     TEXT,
  description  TEXT,
  topics       TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Questions (MCQ bank)
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id        UUID REFERENCES papers(id) ON DELETE SET NULL,
  question_text   TEXT NOT NULL,
  subject         subject_type NOT NULL,
  topic           TEXT,
  difficulty      INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  correct_answer  TEXT,
  marks           INTEGER DEFAULT 1,
  options         JSONB DEFAULT '[]',
  explanation     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Test Results
CREATE TABLE IF NOT EXISTS test_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type             test_type NOT NULL,
  subject               subject_type,
  score                 INTEGER NOT NULL DEFAULT 0,
  total_marks           INTEGER NOT NULL DEFAULT 0,
  questions_attempted   UUID[] DEFAULT '{}',
  weak_topics           TEXT[] DEFAULT '{}',
  time_taken_seconds    INTEGER,
  completed_at          TIMESTAMPTZ DEFAULT now()
);

-- User Paper Progress
CREATE TABLE IF NOT EXISTS user_paper_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id     UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  is_favorite  BOOLEAN DEFAULT false,
  score        INTEGER,
  notes        TEXT,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, paper_id)
);

-- School Leaderboard
CREATE TABLE IF NOT EXISTS school_leaderboard (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name      TEXT NOT NULL,
  total_score      INTEGER DEFAULT 0,
  tests_completed  INTEGER DEFAULT 0,
  rank             INTEGER,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Paper Uploads (student contributions)
CREATE TABLE IF NOT EXISTS paper_uploads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  subject             subject_type NOT NULL,
  year                INTEGER NOT NULL,
  paper_type          paper_type NOT NULL,
  school_name         TEXT,
  file_url            TEXT NOT NULL,
  marking_scheme_url  TEXT,
  status              upload_status DEFAULT 'pending',
  rejection_reason    TEXT,
  contribution_points INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  reviewed_at         TIMESTAMPTZ
);

-- Flashcards (user-created)
CREATE TABLE IF NOT EXISTS flashcards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject      subject_type NOT NULL,
  topic        TEXT,
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  explanation  TEXT,
  image_url    TEXT,
  is_public    BOOLEAN DEFAULT false,
  status       upload_status DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Exercises (user-created)
CREATE TABLE IF NOT EXISTS exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject      subject_type NOT NULL,
  topic        TEXT,
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  explanation  TEXT,
  image_url    TEXT,
  options      JSONB DEFAULT '[]',
  is_public    BOOLEAN DEFAULT false,
  status       upload_status DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  is_pinned   BOOLEAN DEFAULT false,
  reply_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  is_admin_reply BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Schools (admin-managed)
CREATE TABLE IF NOT EXISTS schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  location    TEXT,
  logo_emoji  TEXT DEFAULT '🏫',
  is_approved BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Functions ────────────────────────────────────────────────────────────

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update leaderboard when test is submitted
CREATE OR REPLACE FUNCTION update_leaderboard_on_test_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _school TEXT;
  _points INTEGER;
BEGIN
  SELECT school_name INTO _school FROM profiles WHERE user_id = NEW.user_id;
  IF _school IS NULL THEN _school := 'Unknown School'; END IF;
  _points := CASE WHEN NEW.total_marks > 0 THEN (NEW.score * 100 / NEW.total_marks) ELSE 0 END;

  INSERT INTO school_leaderboard (user_id, school_name, total_score, tests_completed)
  VALUES (NEW.user_id, _school, _points, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    school_name     = _school,
    total_score     = school_leaderboard.total_score + _points,
    tests_completed = school_leaderboard.tests_completed + 1,
    updated_at      = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_test_result_inserted ON test_results;
CREATE TRIGGER on_test_result_inserted
  AFTER INSERT ON test_results
  FOR EACH ROW EXECUTE FUNCTION update_leaderboard_on_test_result();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Check if user has a role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Papers (public read)
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "papers_select_published" ON papers FOR SELECT USING (is_published = true);

-- Questions (authenticated read)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_auth" ON questions FOR SELECT USING (auth.role() = 'authenticated');

-- Test Results (own only)
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_results_own" ON test_results USING (auth.uid() = user_id);
CREATE POLICY "test_results_insert_own" ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Paper Progress (own only)
ALTER TABLE user_paper_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own" ON user_paper_progress USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON user_paper_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard (all can read, own can write)
ALTER TABLE school_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_select_all" ON school_leaderboard FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leaderboard_own" ON school_leaderboard USING (auth.uid() = user_id);

-- Paper Uploads
ALTER TABLE paper_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploads_own" ON paper_uploads USING (auth.uid() = user_id);
CREATE POLICY "uploads_insert_own" ON paper_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flashcards_own" ON flashcards USING (auth.uid() = user_id);
CREATE POLICY "flashcards_approved_public" ON flashcards FOR SELECT USING (status = 'approved' AND is_public = true);

-- Exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_own" ON exercises USING (auth.uid() = user_id);
CREATE POLICY "exercises_approved_public" ON exercises FOR SELECT USING (status = 'approved' AND is_public = true);

-- Forum Posts (all authenticated can read/create)
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_posts_select" ON forum_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Forum Replies
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_replies_select" ON forum_replies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "forum_replies_insert" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Schools (all can read)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_select_approved" ON schools FOR SELECT USING (is_approved = true);

-- ─── Storage ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('paper-uploads', 'paper-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "paper_uploads_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'paper-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "paper_uploads_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'paper-uploads');

-- ─── Seed: Initial Admin Role ─────────────────────────────────────────────
-- Replace 'your-user-id-here' with your Supabase user UUID after first signup
-- INSERT INTO user_roles (user_id, role) VALUES ('your-user-id-here', 'admin');

-- ─── Done ─────────────────────────────────────────────────────────────────
-- Schema created successfully!
-- Next steps:
-- 1. Enable Google and Apple OAuth in Supabase Auth settings
-- 2. Set your site URL in Supabase Auth settings
-- 3. Insert your admin user ID in the seed section above
-- 4. Add papers via the Admin panel at /admin/papers
