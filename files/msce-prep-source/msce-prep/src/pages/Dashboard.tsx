import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Trophy, BookOpen, Target, TrendingUp, ArrowRight, Star, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type TestResult } from '../lib/supabase'
import { getGreeting, percentageToGrade, gradeToColor, getBestSixTotal, getDivision, getSubject, SUBJECTS, timeAgo } from '../lib/utils'

interface SubjectStats {
  subject: string
  avgScore: number
  grade: number
  testCount: number
  trend: 'up' | 'down' | 'stable'
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<SubjectStats[]>([])
  const [streak, setStreak] = useState(0)
  const [recentActivity, setRecentActivity] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  useEffect(() => {
    if (!profile) return
    fetchData()
  }, [profile])

  async function fetchData() {
    if (!profile) return
    setLoading(true)

    // Fetch test results
    const { data: results } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (results) {
      // Calc per-subject stats
      const subjectMap: Record<string, number[]> = {}
      results.forEach(r => {
        if (r.subject && r.total_marks > 0) {
          if (!subjectMap[r.subject]) subjectMap[r.subject] = []
          subjectMap[r.subject].push(Math.round((r.score / r.total_marks) * 100))
        }
      })

      const subjectStats: SubjectStats[] = profile.subjects.map(sub => {
        const scores = subjectMap[sub] || []
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        const grade = avgScore > 0 ? percentageToGrade(avgScore) : 9
        const trend = scores.length >= 2
          ? scores[0] > scores[1] ? 'up' : scores[0] < scores[1] ? 'down' : 'stable'
          : 'stable'
        return { subject: sub, avgScore, grade, testCount: scores.length, trend }
      })

      setStats(subjectStats)
      setRecentActivity(results.slice(0, 5))

      // Streak: consecutive days with activity
      const days = new Set(results.map(r => new Date(r.completed_at).toDateString()))
      let s = 0, d = new Date()
      while (days.has(d.toDateString())) {
        s++
        d.setDate(d.getDate() - 1)
      }
      setStreak(s)
    }
    setLoading(false)
  }

  const grades = stats.filter(s => s.testCount > 0).map(s => s.grade)
  const bestSix = getBestSixTotal(grades)
  const division = grades.length >= 6 ? getDivision(bestSix) : null

  // Next weekly test countdown
  const today = new Date()
  const testDayIdx = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(profile?.preferred_test_day || 'saturday')
  const daysUntilTest = (testDayIdx - today.getDay() + 7) % 7 || 7

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {grades.length >= 6
              ? `Your Best Six total is ${bestSix} points — ${division}`
              : 'Complete more tests to see your MSCE prediction'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Flame size={18} className="text-amber-500" />
          <div>
            <div className="text-lg font-bold leading-none font-display" style={{ color: 'var(--text-primary)' }}>{streak}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Day streak</div>
          </div>
        </div>
      </div>

      {/* MSCE Prediction Banner */}
      {grades.length >= 6 && (
        <div className="rounded-2xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold font-display text-lg">If you wrote MSCE today</h2>
              <p className="text-white/70 text-sm">Based on your practice performance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-display text-amber-400">{bestSix} pts</div>
              <div className="text-sm text-white/70">{division}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stats.filter(s => s.testCount > 0).slice(0, 6).map(s => {
              const subj = getSubject(s.subject as any)
              return (
                <div key={s.subject} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{subj.emoji}</span>
                    <span className="text-xs text-white/70 truncate">{subj.label}</span>
                  </div>
                  <div className={`text-lg font-bold font-display ${gradeToColor(s.grade)}`}>
                    Grade {s.grade}
                  </div>
                  <div className="text-xs text-white/50">{s.avgScore}% avg</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Weekly Test', value: `${daysUntilTest}d`, sub: 'until next test', icon: <Calendar size={18} />, color: '#3b82f6', action: () => navigate('/tests') },
          { label: 'Tests Done', value: recentActivity.length.toString(), sub: 'this session', icon: <BookOpen size={18} />, color: '#10b981', action: () => navigate('/progress') },
          { label: 'Best Grade', value: grades.length ? `Grade ${Math.min(...grades)}` : '—', sub: 'across subjects', icon: <Star size={18} />, color: '#e9ae34', action: () => navigate('/progress') },
          { label: 'Leaderboard', value: '#—', sub: 'school rank', icon: <Trophy size={18} />, color: '#f97316', action: () => navigate('/leaderboard') },
        ].map(stat => (
          <button key={stat.label} onClick={stat.action}
            className="card-elevated rounded-2xl p-4 text-left transition-all">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="font-bold font-display text-xl" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Priority Subjects */}
      {profile?.priority_subjects?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Priority Subjects</h2>
            <button onClick={() => navigate('/progress')} className="text-xs flex items-center gap-1" style={{ color: '#e9ae34' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.priority_subjects.map(sv => {
              const stat = stats.find(s => s.subject === sv)
              const subj = getSubject(sv)
              return (
                <div key={sv} className="card-elevated rounded-2xl p-4" onClick={() => navigate(`/tests?subject=${sv}`)} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${subj.color}20` }}>
                      {subj.emoji}
                    </div>
                    <div>
                      <div className="font-semibold font-display text-sm" style={{ color: 'var(--text-primary)' }}>{subj.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat?.testCount || 0} tests taken</div>
                    </div>
                    {stat?.testCount > 0 && (
                      <div className={`ml-auto font-bold font-display text-2xl ${gradeToColor(stat.grade)}`}>
                        {stat.grade}
                      </div>
                    )}
                  </div>
                  {stat?.testCount > 0 ? (
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stat.avgScore}%`, background: subj.color }} />
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); navigate(`/tests?subject=${sv}`) }} className="btn btn-accent w-full py-2 text-xs">
                      Start Practising
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Two columns: Recent Activity + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
            <button onClick={() => navigate('/progress')} className="text-xs flex items-center gap-1" style={{ color: '#e9ae34' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet. Start a test!</p>
              <button onClick={() => navigate('/tests')} className="btn btn-accent mt-3 text-sm">Take a Test</button>
            </div>
          ) : recentActivity.map(r => {
            const subj = r.subject ? getSubject(r.subject) : null
            const pct = r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0
            return (
              <div key={r.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${subj?.color || '#64748b'}20` }}>
                  {subj?.emoji || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {subj?.label || 'Mixed'} {r.test_type === 'weekly' ? 'Weekly Test' : 'Practice'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(r.completed_at)}</div>
                </div>
                <div className="font-bold text-sm" style={{ color: pct >= 65 ? '#16a34a' : pct >= 45 ? '#d97706' : '#dc2626' }}>
                  {pct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
          {[
            { label: 'Continue Last Paper', sub: 'Pick up where you left off', icon: '📄', color: '#3b82f6', action: () => navigate('/papers') },
            { label: 'Practice Weakest Topic', sub: stats.length > 0 ? `Focus on ${getSubject(stats.sort((a,b) => b.grade - a.grade)[0]?.subject as any)?.label || '—'}` : 'Take a test first', icon: '🎯', color: '#8b5cf6', action: () => navigate('/take-test') },
            { label: 'Take Weekly Test', sub: `Next test in ${daysUntilTest} day${daysUntilTest !== 1 ? 's' : ''}`, icon: '⏱️', color: '#10b981', action: () => navigate('/tests') },
            { label: 'Browse Library', sub: 'Past papers, flashcards & more', icon: '📚', color: '#f59e0b', action: () => navigate('/papers') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="card-elevated rounded-2xl p-4 w-full flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${a.color}15` }}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>{a.label}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{a.sub}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
