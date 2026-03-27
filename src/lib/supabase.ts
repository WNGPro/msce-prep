import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // XP & streak system
  total_xp: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  level: number
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
  // Extended MSCE fields
  question_type: 'mcq' | 'short_answer' | 'essay' | 'practical'
  paper_number: 'paper_1' | 'paper_2' | 'paper_3' | null
  section: 'section_a' | 'section_b' | 'section_c' | null
  question_number: string | null
  sub_question: string | null
  marking_guide: string | null
  year: number | null
  has_diagram: boolean
  diagram_description: string | null
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
  total_xp: number
  tests_completed: number
  rank: number | null
  updated_at: string
}

export interface PaperUpload {
  id: string
  user_id: string
  title: string
  subject: SubjectType
  year: number
  paper_type: PaperType
  school_name: string | null
  file_url: string
  marking_scheme_url: string | null
  status: UploadStatus
  rejection_reason: string | null
  contribution_points: number
  created_at: string
  reviewed_at: string | null
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
  // Deck system
  deck_id: string | null
  front: string | null
  back: string | null
  order_index: number
  created_at: string
}

export interface FlashcardDeck {
  id: string
  user_id: string
  title: string
  subject: SubjectType
  topic: string | null
  card_count: number
  is_public: boolean
  pending_approval: boolean
  created_at: string
}

export interface CommunityQuiz {
  id: string
  user_id: string
  title: string
  subject: SubjectType
  topic: string | null
  question_count: number
  total_marks: number
  is_public: boolean
  pending_approval: boolean
  created_at: string
}

export interface CommunityQuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  correct_answer: string
  marks: number
  order_index: number
  created_at: string
}

export interface LibraryMaterial {
  id: string
  title: string
  subject: SubjectType
  material_type: 'notes' | 'textbook' | 'summary' | 'pamphlet' | 'other'
  file_url: string | null
  description: string | null
  is_published: boolean
  created_by: string | null
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
}

export interface ForumReply {
  id: string
  post_id: string
  user_id: string
  body: string
  is_admin_reply: boolean
  created_at: string
}

export interface School {
  id: string
  name: string
  location: string | null
  is_approved: boolean
  added_by: string | null
  created_at: string
}

export interface XPLog {
  id: string
  user_id: string
  action: string
  xp_earned: number
  subject: string | null
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: AppRole
  created_at: string
}
// ─── Joined Types (for queries with relations) ───────────────────────────────

// Minimal profile used in joins (DON’T use full Profile here)
export type ProfileBasic = {
  full_name: string | null
  avatar_color: string | null
}
export type ForumPostWithProfile = ForumPost & {
  profiles: ProfileBasic | null
}
export type ForumReplyWithProfile = ForumReply & {
  profiles: ProfileBasic | null
}
