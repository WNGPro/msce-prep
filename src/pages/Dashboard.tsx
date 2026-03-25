import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Flame, Trophy, ArrowRight, TrendingUp, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { awardXP, xpToLevel, xpToNextLevel, levelTitle, XP_ACTIONS } from '../lib/useXP'
import { SUBJECTS } from '../lib/utils'
import { toast } from 'sonner'

// MSCE grade from percentage
function pctToGrade(pct: number): number {
  if (pct >= 85) return 1
  if (pct >= 75) return 2
  if (pct >= 65) return 3
  if (pct >= 55) return 4
  if (pct >= 45) return 5
  if (pct >= 35) return 6
  if (pct >= 25) return 7
  if (pct >= 15) return 8
  return 9
}

function gradeColor(g: number): string {
  if (g <= 2) return '#16a34a'
  if (g <= 4) return '#0ea5e9'
  if (g <= 6) return '#f59e0b'
  return '#ef4444'
}

function getDivision(total: number): string {
  if (total <= 9)  return 'Division 1'
  if (total <= 18) return 'Division 2'
  if (total <= 27) return 'Division 3'
  if (total <= 36) return 'Division 4'
  return 'Fail'
}

function divisionColor(total: number): string {
  if (total <= 9)  return '#16a34a'
  if (total <= 18) return '#0ea5e9'
  if (total <= 27) return '#f59e0b'
  return '#ef4444'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [recentPapers, setRecentPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [awardedLogin, setAwardedLogin] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (user) {
      fetchData()
      awardDailyLogin()
    }
  }, [user])

  async function awardDailyLogin() {
    if (!user || awardedLogin) return
    const today = new Date().toISOString().split('T')[0]
    const lastActive = profile?.last_active_date
    if (lastActive !== today) {
      await awardXP(user.id, 'daily_login')
    }
    setAwardedLogin(true)
  }

  async function fetchData() {
    setLoading(true)
    const [{ data: results }, { data: papers }] = await Promise.all([
      supabase.from('test_results').select('*').eq('user_id', user!.id).order('completed_at', { ascending: false }).limit(30),
      supabase.from('user_paper_progress').select('*, papers(title, subject, year)').eq('user_id', user!.id).order('completed_at', { ascending: false }).limit(5),
    ])
    setTestResults(results || [])
    setRecentPapers(papers || [])
    setLoading(false)
  }

  // Calculate per-subject performance from test results
  const subjectStats: Record<string, { scores: number[]; name: string; emoji: string }> = {}
  for (const r of testResults) {
    if (!r.subject || !r.total_marks) continue
    const pct = Math.round((r.score / r.total_marks) * 100)
    if (!subjectStats[r.subject]) {
      const sub = SUBJECTS.find(s => s.value === r.subject)
      subjectStats[r.subject] = { scores: [], name: sub?.label || r.subject, emoji: sub?.emoji || '📚' }
    }
    subjectStats[r.subject].scores.push(pct)
  }

  const subjectGrades = Object.entries(subjectStats).map(([key, val]) => {
    const avg = Math.round(val.scores.reduce((a, b) => a + b, 0) / val.scores.length)
    return { key, name: val.name, emoji: val.emoji, avg, grade: pctToGrade(avg) }
  }).sort((a, b) => a.grade - b.grade)

  // Best six total
  const bestSix = subjectGrades.slice(0, 6)
  const bestSixTotal = bestSix.reduce((sum, s) => sum + s.grade, 0)

  // XP + streak
  const totalXP = profile?.total_xp || 0
  const streak = profile?.current_streak || 0
  const level = xpToLevel(totalXP)
  const { current: xpCurrent, needed: xpNeeded, percent: xpPercent } = xpToNextLevel(totalXP)

  const prioritySubs = (profile?.priority_subjects || []).map(ps => SUBJECTS.find(s => s.value === ps)).filter(Boolean)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="px-4 pt-6 max-w-2xl mx-auto">

        {/* ── GREETING + STREAK ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm mb-0.5" style={{ color: 'var(--text-muted)' }}>{greeting},</p>
            <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{firstName} 👋</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background: streak > 0 ? 'rgba(233,174,52,0.12)' : 'var(--surface)', border: `1.5px solid ${streak > 0 ? 'rgba(233,174,52,0.3)' : 'var(--border)'}` }}>
            <Flame size={18} style={{ color: streak > 0 ? '#e9ae34' : 'var(--text-muted)' }} />
            <div className="text-right">
              <p className="font-bold text-lg leading-none" style={{ color: streak > 0 ? '#e9ae34' : 'var(--text-primary)' }}>{streak}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>day streak</p>
            </div>
          </div>
        </div>

        {/* ── XP / LEVEL BAR ── */}
        <div className="card rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                {level}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{levelTitle(level)}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Level {level} · {totalXP} XP total</p>
              </div>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {xpCurrent}/{xpNeeded} to Lv.{level + 1}
            </p>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, #e9ae34, #f5c842)' }} />
          </div>
        </div>

        {/* ── MSCE PREDICTION ── */}
        {subjectGrades.length > 0 ? (
          <div className="card rounded-2xl p-4 mb-4"
            style={{ border: '1.5px solid rgba(233,174,52,0.2)', background: 'rgba(233,174,52,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-wider" style={{ color: '#e9ae34' }}>IF YOU SAT MSCE TODAY</p>
              {bestSix.length >= 3 && (
                <div className="text-right">
                  <span className="font-bold text-sm" style={{ color: divisionColor(bestSixTotal) }}>
                    {getDivision(bestSixTotal)}
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{bestSixTotal} pts (best 6)</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {subjectGrades.slice(0, 6).map(s => (
                <div key={s.key} className="rounded-xl p-2.5 text-center"
                  style={{ background: 'var(--surface-2)' }}>
                  <div className="text-lg font-bold leading-none mb-1"
                    style={{ color: gradeColor(s.grade) }}>{s.grade}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {s.emoji} {s.name}
                  </div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {s.avg}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card rounded-2xl p-5 mb-4 text-center"
            style={{ border: '1.5px dashed var(--border)' }}>
            <p className="text-2xl mb-2">📊</p>
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>No grade predictions yet</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Complete a test to see your predicted MSCE grades</p>
            <button onClick={() => navigate('/tests')}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#e9ae34', color: '#1f3d5d' }}>
              Take a Test
            </button>
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => navigate('/papers')}
            className="card rounded-2xl p-4 text-left transition-all hover:scale-[1.02]">
            <BookOpen size={20} className="mb-2" style={{ color: '#e9ae34' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Library</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Past papers & materials</p>
          </button>
          <button onClick={() => navigate('/tests')}
            className="card rounded-2xl p-4 text-left transition-all hover:scale-[1.02]">
            <Star size={20} className="mb-2" style={{ color: '#8b5cf6' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Weekly Test</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {prioritySubs.length > 0 ? `${(prioritySubs[0] as any)?.label} & ${(prioritySubs[1] as any)?.label}` : 'Take your test'}
            </p>
          </button>
          <button onClick={() => navigate('/create')}
            className="card rounded-2xl p-4 text-left transition-all hover:scale-[1.02]">
            <span className="text-xl mb-2 block">🃏</span>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Create</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Flashcards & quizzes</p>
          </button>
          <button onClick={() => navigate('/leaderboard')}
            className="card rounded-2xl p-4 text-left transition-all hover:scale-[1.02]">
            <Trophy size={20} className="mb-2" style={{ color: '#f59e0b' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Leaderboard</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>See your rank</p>
          </button>
        </div>

        {/* ── XP ACTIONS GUIDE ── */}
        <div className="card rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold mb-3 tracking-wider" style={{ color: 'var(--text-muted)' }}>EARN XP</p>
          <div className="grid gap-2">
            {(Object.entries(XP_ACTIONS) as [string, number][]).map(([action, xp]) => (
              <div key={action} className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(233,174,52,0.15)', color: '#e9ae34' }}>
                  +{xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECENT ACTIVITY ── */}
        {testResults.length > 0 && (
          <div className="card rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>Recent Tests</p>
              <button onClick={() => navigate('/progress')} className="flex items-center gap-1 text-xs"
                style={{ color: '#e9ae34' }}>
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid gap-2">
              {testResults.slice(0, 4).map(r => {
                const sub = SUBJECTS.find(s => s.value === r.subject)
                const pct = r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0
                const grade = pctToGrade(pct)
                return (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'var(--surface-2)' }}>
                      {sub?.emoji || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {sub?.label || r.subject || 'Mixed'} · {r.test_type}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {r.score}/{r.total_marks} marks
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: gradeColor(grade) }}>Grade {grade}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── AI TEASER ── */}
        <div className="card rounded-2xl p-4 mb-4"
          style={{ border: '1.5px dashed rgba(233,174,52,0.3)', background: 'rgba(233,174,52,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span>✨</span>
            <p className="text-xs font-bold" style={{ color: '#e9ae34' }}>AI Features — Coming Soon</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            AI tutoring, adaptive testing and paper analysis. Arriving once the platform has enough real MSCE context.
          </p>
        </div>

      </div>
    </div>
  )
}
