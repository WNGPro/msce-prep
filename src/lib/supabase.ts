import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ─────────────────────────────────────────────────────────────────

export type SubjectType =
  | 'mathematics' | 'english' | 'chichewa' | 'biology' | 'physical_science'
  | 'chemistry' | 'physics' | 'geography' | 'history' | 'agriculture'
  | 'bible_knowledge' | 'social_studies' | 'computer_studies' | 'life_skills'
  | 'additional_math' | 'home_economics' | 'business_studies' | 'french'

export type PaperType = 'msce_official' | 'school_paper'
export type TestType = 'weekly' | 'custom' | 'paper' | 'cross_subject'
export type UploadStatus = 'pending' | 'approved' | 'rejected'
export type AppRole = 'admin' | 'moderator' | 'user'

export interface Profile {
  id: string
  user_id: string
  email: string | null
  full_name: string | null
  school_name: string | null
  subjects: SubjectType[]
  priority_subjects: SubjectType[]
  preferred_test_day: string
  onboarding_completed: boolean
  avatar_preset: string
  avatar_color: string
  banner_preset: string
  avatar_url: string | null
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface Paper {
  id: string
  title: string
  subject: SubjectType
  year: number
  paper_type: PaperType
  file_url: string | null
  description: string | null
  topics: string[]
  is_published: boolean
  created_at: string
}

export interface Question {
  id: string
  paper_id: string | null
  question_text: string
  subject: SubjectType
  topic: string | null
  difficulty: number
  correct_answer: string | null
  marks: number
  options: string[]
  explanation: string | null
  created_at: string
}

export interface TestResult {
  id: string
  user_id: string
  test_type: TestType
  subject: SubjectType | null
  score: number
  total_marks: number
  questions_attempted: string[]
  weak_topics: string[]
  time_taken_seconds: number | null
  completed_at: string
}

export interface UserPaperProgress {
  id: string
  user_id: string
  paper_id: string
  is_completed: boolean
  is_favorite: boolean
  score: number | null
  notes: string | null
  completed_at: string | null
}

export interface SchoolLeaderboard {
  id: string
  user_id: string
  school_name: string
  total_score: number
  tests_completed: number
  rank: number | null
  updated_at: string
}

export interface Flashcard {
  id: string
  user_id: string
  subject: SubjectType
  topic: string | null
  question: string
  answer: string
  explanation: string | null
  image_url: string | null
  is_public: boolean
  status: UploadStatus
  created_at: string
}

export interface Exercise {
  id: string
  user_id: string
  title: string
  subject: SubjectType
  topic: string | null
  question: string
  answer: string
  explanation: string | null
  image_url: string | null
  options: string[]
  is_public: boolean
  status: UploadStatus
  created_at: string
}

export interface ForumPost {
  id: string
  user_id: string
  title: string
  body: string
  category: string
  is_pinned: boolean
  reply_count: number
  created_at: string
  profiles?: { full_name: string; avatar_preset: string; avatar_color: string }
}

export interface ForumReply {
  id: string
  post_id: string
  user_id: string
  body: string
  is_admin_reply: boolean
  created_at: string
  profiles?: { full_name: string; avatar_preset: string; avatar_color: string }
}
