import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, Play, BarChart3, Flame } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type TestResult, type SubjectType } from '../lib/supabase'
import { SUBJECTS, getSubject, percentageToGrade, gradeToColor, formatDate, cn } from '../lib/utils'

export default function Tests() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'weekly' | 'custom' | 'history'>('weekly')
  const [history, setHistory] = useState<TestResult[]>([])
  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [weeklyDone, setWeeklyDone] = useState(false)

  useEffect(() => {
    if (params.get('subject')) setTab('custom')
    fetchData()
  }, [profile])

  async function fetchData() {
    if (!profile) return
    const { data } = await supabase
      .from('test_results').select('*')
      .eq('user_id', profile.user_id)
      .order('completed_at', { ascending: false })
      .limit(50)
    if (data) {
      setHistory(data as TestResult[])
      const scores: Record<string, number[]> = {}
      data.forEach(r => {
        if (r.subject && r.total_marks > 0) {
          if (!scores[r.subject]) scores[r.subject] = []
          scores[r.subject].push(Math.round((r.score / r.total_marks) * 100))
        }
      })
      const avg: Record<string, number> = {}
      Object.entries(scores).forEach(([s, arr]) => { avg[s] = Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) })
      setSubjectScores(avg)

      const thisWeek = new Date(); thisWeek.setDate(thisWeek.getDate() - 7)
      const weeklyTests = data.filter(r => r.test_type === 'weekly' && new Date(r.completed_at) > thisWeek)
      setWeeklyDone(weeklyTests.length > 0)
    }
    setLoading(false)
  }

  const today = new Date()
  const testDayIdx = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    .indexOf(profile?.preferred_test_day || 'saturday')
  const daysUntilTest = (testDayIdx - today.getDay() + 7) % 7 || 7
  const nextTestDate = new Date(today); nextTestDate.setDate(today.getDate() + daysUntilTest)

  const startTest = (subject?: SubjectType, type: 'weekly' | 'custom' = 'custom') => {
    const q = new URLSearchParams()
    if (subject) q.set('subject', subject)
    q.set('type', type)
    navigate(`/take-test?${q.toString()}`)
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Tests</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Practice tests to build your MSCE grade</p>

      <div className="flex rounded-xl p-1 mb-6 w-fit" style={{ background: 'var(--surface-2)' }}>
        {(['weekly', 'custom', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
            style={tab === t ? { color: 'var(--text-primary)' } : {}}>
            {t === 'history' ? 'History' : t === 'weekly' ? 'Weekly Test' : 'Practice'}
          </button>
        ))}
      </div>

      {tab === 'weekly' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold font-display text-xl mb-1">Weekly Test</h2>
                <p className="text-white/70 text-sm">30-minute timed exam on your priority subjects</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold font-display text-amber-400">{daysUntilTest}</div>
                <div className="text-white/50 text-sm">days away</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Calendar size={16} className="text-amber-400 mb-1" />
                <div className="text-white/70 text-xs">Next Test</div>
                <div className="font-semibold text-sm">{nextTestDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Clock size={16} className="text-amber-400 mb-1" />
                <div className="text-white/70 text-xs">Duration</div>
                <div className="font-semibold text-sm">30 min</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Flame size={16} className="text-amber-400 mb-1" />
                <div className="text-white/70 text-xs">This Week</div>
                <div className={`font-semibold text-sm ${weeklyDone ? 'text-green-400' : 'text-white'}`}>
                  {weeklyDone ? '✓ Done' : 'Not taken'}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {profile?.priority_subjects?.map(sub => {
                const s = getSubject(sub)
                return (
                  <div key={sub} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <span>{s.emoji}</span>
                    <span className="text-sm">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <button onClick={() => startTest(undefined, 'weekly')} className="btn btn-accent w-full py-4 text-base font-bold gap-2">
            <Play size={18} /> {weeklyDone ? 'Retake Weekly Test' : 'Start Weekly Test'}
          </button>
        </div>
      )}

      {tab === 'custom' && (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Select a subject to start a practice test</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(profile?.subjects || []).map(sub => {
              const s = getSubject(sub)
              const avg = subjectScores[sub] || 0
              const grade = avg > 0 ? percentageToGrade(avg) : null
              return (
                <button key={sub} onClick={() => startTest(sub)}
                  className="card-elevated rounded-2xl p-4 flex items-center gap-4 text-left hover:border-amber-400 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${s.color}20` }}>
                    {s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold font-display text-sm" style={{ color: 'var(--text-primary)' }}>{s.label}</div>
                    {avg > 0 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${avg}%`, background: s.color }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{avg}%</span>
                      </div>
                    ) : (
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No tests yet</div>
                    )}
                  </div>
                  {grade && (
                    <div className={`font-bold font-display text-2xl flex-shrink-0 ${gradeToColor(grade)}`}>{grade}</div>
                  )}
                  <Play size={16} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>No tests yet</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Start a test to track your progress</p>
              <button onClick={() => setTab('custom')} className="btn btn-accent">Start First Test</button>
            </div>
          ) : history.map(r => {
            const pct = r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0
            const s = r.subject ? getSubject(r.subject) : null
            const passed = pct >= 50
            return (
              <div key={r.id} className="card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: passed ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>
                  {s?.emoji || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>
                    {s?.label || 'Mixed'} — {r.test_type === 'weekly' ? 'Weekly Test' : 'Practice'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(r.completed_at)}</div>
                  {r.weak_topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.weak_topics.slice(0, 3).map(t => (
                        <span key={t} className="badge badge-error text-xs">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold font-display text-xl ${passed ? 'text-green-500' : 'text-red-500'}`}>{pct}%</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.score}/{r.total_marks}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
