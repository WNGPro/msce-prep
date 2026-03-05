import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SubjectType } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── MSCE Grading ──────────────────────────────────────────────────────────

export function percentageToGrade(
  percent: number,
  boundaries?: number[]
): number {
  // Default MSCE boundaries (admin can override)
  const b = boundaries ?? [85, 75, 65, 55, 45, 35, 25, 15]
  if (percent >= b[0]) return 1
  if (percent >= b[1]) return 2
  if (percent >= b[2]) return 3
  if (percent >= b[3]) return 4
  if (percent >= b[4]) return 5
  if (percent >= b[5]) return 6
  if (percent >= b[6]) return 7
  if (percent >= b[7]) return 8
  return 9
}

export function gradeToColor(grade: number): string {
  if (grade <= 2) return 'text-green-600 dark:text-green-400'
  if (grade <= 4) return 'text-teal-600 dark:text-teal-400'
  if (grade <= 6) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function gradeToLabel(grade: number): string {
  const labels: Record<number, string> = {
    1: 'Distinction', 2: 'Distinction', 3: 'Credit', 4: 'Credit',
    5: 'Pass', 6: 'Pass', 7: 'Fail', 8: 'Fail', 9: 'Fail'
  }
  return labels[grade] || 'N/A'
}

export function getBestSixTotal(grades: number[]): number {
  return [...grades].sort((a, b) => a - b).slice(0, 6).reduce((s, g) => s + g, 0)
}

export function getDivision(total: number): string {
  if (total <= 6) return 'Division 1'
  if (total <= 12) return 'Division 2'
  if (total <= 24) return 'Division 3'
  if (total <= 36) return 'Division 4'
  return 'Fail'
}

// ─── Subjects ──────────────────────────────────────────────────────────────

export const SUBJECTS: { value: SubjectType; label: string; emoji: string; color: string }[] = [
  { value: 'english', label: 'English', emoji: '📚', color: '#3b82f6' },
  { value: 'mathematics', label: 'Mathematics', emoji: '📐', color: '#8b5cf6' },
  { value: 'biology', label: 'Biology', emoji: '🧬', color: '#10b981' },
  { value: 'physics', label: 'Physics', emoji: '⚛️', color: '#6366f1' },
  { value: 'chemistry', label: 'Chemistry', emoji: '🧪', color: '#f59e0b' },
  { value: 'geography', label: 'Geography', emoji: '🌍', color: '#22c55e' },
  { value: 'history', label: 'History', emoji: '📜', color: '#a16207' },
  { value: 'agriculture', label: 'Agriculture', emoji: '🌾', color: '#84cc16' },
  { value: 'computer_studies', label: 'Computer Studies', emoji: '💻', color: '#06b6d4' },
  { value: 'chichewa', label: 'Chichewa', emoji: '🗣️', color: '#ec4899' },
  { value: 'physical_science', label: 'Physical Science', emoji: '⚗️', color: '#f97316' },
  { value: 'bible_knowledge', label: 'Bible Knowledge', emoji: '📖', color: '#64748b' },
  { value: 'social_studies', label: 'Social & Life Skills', emoji: '👥', color: '#14b8a6' },
  { value: 'additional_math', label: 'Additional Math', emoji: '➕', color: '#7c3aed' },
  { value: 'home_economics', label: 'Home Economics', emoji: '🏠', color: '#f43f5e' },
  { value: 'business_studies', label: 'Business Studies', emoji: '💼', color: '#0ea5e9' },
  { value: 'french', label: 'French', emoji: '🇫🇷', color: '#3b82f6' },
  { value: 'life_skills', label: 'Life Skills', emoji: '🎯', color: '#8b5cf6' },
]

export function getSubject(value: SubjectType) {
  return SUBJECTS.find(s => s.value === value) ?? SUBJECTS[0]
}

// ─── SUBJECT TOPICS ─────────────────────────────────────────────────────────

export const SUBJECT_TOPICS: Partial<Record<SubjectType, string[]>> = {
  mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus', 'Number Theory', 'Matrices', 'Probability'],
  biology: ['Cell Biology', 'Genetics', 'Ecology', 'Human Anatomy', 'Plant Biology', 'Evolution', 'Nutrition', 'Respiration'],
  physics: ['Mechanics', 'Waves', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Nuclear Physics'],
  chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Reactions', 'Bonding', 'Acids & Bases'],
  geography: ['Physical Geography', 'Human Geography', 'Map Skills', 'Climate', 'Development', 'Settlement'],
  agriculture: ['Crop Production', 'Animal Husbandry', 'Soil Science', 'Farm Management', 'Irrigation', 'Pest Control'],
  english: ['Comprehension', 'Grammar', 'Essay Writing', 'Literature', 'Vocabulary', 'Oral Skills'],
  history: ['Colonial History', 'Independence Movements', 'World Wars', 'Malawi History', 'Ancient Civilizations'],
  computer_studies: ['Hardware', 'Software', 'Networks', 'Programming', 'Data Handling', 'Internet'],
  business_studies: ['Marketing', 'Accounting', 'Management', 'Economics', 'Entrepreneurship'],
}

// ─── Avatar colors ─────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  { value: '#1f3d5d', label: 'Navy' },
  { value: '#e9ae34', label: 'Gold' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#64748b', label: 'Slate' },
  { value: '#ec4899', label: 'Pink' },
]

// ─── Banner presets ─────────────────────────────────────────────────────────

export const BANNER_PRESETS = [
  { value: 'navy-wave', label: 'Navy Wave', gradient: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' },
  { value: 'golden-hour', label: 'Golden Hour', gradient: 'linear-gradient(135deg, #e9ae34 0%, #f0c44a 100%)' },
  { value: 'teal-geo', label: 'Geometric Teal', gradient: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' },
  { value: 'purple-dream', label: 'Purple Dream', gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' },
  { value: 'malawi-pride', label: 'Malawi Pride', gradient: 'linear-gradient(135deg, #000000 0%, #ce1126 50%, #339e35 100%)' },
  { value: 'warm-heart', label: 'Warm Heart', gradient: 'linear-gradient(135deg, #339e35 0%, #000000 50%, #ce1126 100%)' },
  { value: 'forest-green', label: 'Forest Green', gradient: 'linear-gradient(135deg, #166534 0%, #15803d 100%)' },
  { value: 'sunset-safari', label: 'Sunset Safari', gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #fbbf24 100%)' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function formatSeconds(s: number): string {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}
