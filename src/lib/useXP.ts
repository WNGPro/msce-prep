import { supabase } from './supabase'

// XP values per action — tweak these to balance the game
export const XP_ACTIONS = {
  complete_test:       50,
  complete_weekly_test: 80,
  complete_paper:      30,
  build_flashcard_deck: 25,
  build_quiz:          25,
  review_flashcards:   10,
  daily_login:          5,
  forum_post:          15,
  upload_paper:        40,
} as const

export type XPAction = keyof typeof XP_ACTIONS

// Level thresholds — every 200 XP = 1 level
export function xpToLevel(xp: number): number {
  return Math.floor(xp / 200) + 1
}

export function xpToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = xpToLevel(xp)
  const current = xp - (level - 1) * 200
  const needed = 200
  return { current, needed, percent: Math.round((current / needed) * 100) }
}

export function levelTitle(level: number): string {
  if (level >= 20) return 'MSCE Champion'
  if (level >= 15) return 'Division 1 Candidate'
  if (level >= 10) return 'Division 2 Candidate'
  if (level >= 7)  return 'Consistent Reviser'
  if (level >= 5)  return 'Active Student'
  if (level >= 3)  return 'Getting Started'
  return 'New Student'
}

export async function awardXP(
  userId: string,
  action: XPAction,
  subject?: string
): Promise<{ newXP: number; newStreak: number; leveledUp: boolean }> {
  const xpEarned = XP_ACTIONS[action]

  // Get current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('total_xp, current_streak, longest_streak, last_active_date, level')
    .eq('user_id', userId)
    .single()

  if (error || !profile) return { newXP: 0, newStreak: 0, leveledUp: false }

  const today = new Date().toISOString().split('T')[0]
  const lastActive = profile.last_active_date

  // Calculate streak
  let newStreak = profile.current_streak || 0
  if (lastActive === today) {
    // Already active today — streak stays the same
    newStreak = profile.current_streak
  } else if (lastActive) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]
    if (lastActive === yStr) {
      // Active yesterday — extend streak
      newStreak = (profile.current_streak || 0) + 1
    } else {
      // Missed a day — reset streak
      newStreak = 1
    }
  } else {
    // First ever activity
    newStreak = 1
  }

  const newXP = (profile.total_xp || 0) + xpEarned
  const oldLevel = profile.level || 1
  const newLevel = xpToLevel(newXP)
  const leveledUp = newLevel > oldLevel
  const newLongest = Math.max(profile.longest_streak || 0, newStreak)

  // Update profile
  await supabase.from('profiles').update({
    total_xp: newXP,
    current_streak: newStreak,
    longest_streak: newLongest,
    last_active_date: today,
    level: newLevel,
  }).eq('user_id', userId)

  // Log the XP event
  await supabase.from('xp_log').insert({
    user_id: userId,
    action,
    xp_earned: xpEarned,
    subject: subject || null,
  })

  // Update leaderboard XP
  await supabase.from('school_leaderboard')
    .update({ total_xp: newXP })
    .eq('user_id', userId)

  return { newXP, newStreak, leveledUp }
}
