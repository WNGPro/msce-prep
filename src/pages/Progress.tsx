import React, { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Award, Clock, BookOpen, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type TestResult } from '../lib/supabase'
import { percentageToGrade, gradeToColor, getBestSixTotal, getDivision, getSubject, formatDate, cn } from '../lib/utils'

export default function Progress() {
  const { profile } = useAuth()
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchResults() }, [profile])

  async function fetchResults() {
    if (!profile) return
    const { data } = await supabase
      .from('test_results').select('*')
      .eq('user_id', profile.user_id)
      .order('completed_at', { ascending: true })
    setResults(data as TestResult[] || [])
    setLoading(false)
  }

  // Per-subject stats
  const subjectMap: Record<string, { scores: number[]; weakTopics: string[] }> = {}
  results.forEach(r => {
    if (r.subject && r.total_marks > 0) {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { scores: [], weakTopics: [] }
      subjectMap[r.subject].scores.push(Math.round((r.score / r.total_marks) * 100))
      subjectMap[r.subject].weakTopics.push(...(r.weak_topics || []))
    }
  })

  const subjectStats = (profile?.subjects || []).map(sub => {
    const d = subjectMap[sub] || { scores: [], weakTopics: [] }
    const avgScore = d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0
    const grade = avgScore > 0 ? percentageToGrade(avgScore) : 9
    const last2 = d.scores.slice(-2)
    const trend: 'up' | 'down' | 'stable' = last2.length < 2 ? 'stable' : last2[1] > last2[0] ? 'up' : last2[1] < last2[0] ? 'down' : 'stable'
    return { subject: sub, avgScore, grade, testCount: d.scores.length, trend, weakTopics: [...new Set(d.weakTopics)].slice(0, 3) }
  }).filter(s => s.testCount > 0)

  const grades = subjectStats.map(s => s.grade)
  const bestSix = getBestSixTotal(grades)
  const division = grades.length >= 6 ? getDivision(bestSix) : null

  // Chart data
  const chartData = results.slice(-15).map((r, i) => ({
    name: `#${i + 1}`,
    score: r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0,
    date: formatDate(r.completed_at)
  }))

  // Global stats
  const totalTime = results.reduce((s, r) => s + (r.time_taken_seconds || 0), 0)
  const avgScore = results.length
    ? Math.round(results.filter(r => r.total_marks > 0).reduce((s, r) => s + (r.score / r.total_marks) * 100, 0) / results.filter(r => r.total_marks > 0).length)
    : 0

  const allWeakTopics = results.flatMap(r => r.weak_topics || [])
  const weakTopicFreq: Record<string, number> = {}
  allWeakTopics.forEach(t => { weakTopicFreq[t] = (weakTopicFreq[t] || 0) + 1 })
  const topWeakTopics = Object.entries(weakTopicFreq).sort(([,a],[,b]) => b - a).slice(0, 5)

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="shimmer h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>My Progress</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Track your MSCE preparation journey</p>

      {/* Best Six */}
      {grades.length >= 6 && (
        <div className="rounded-2xl p-5 mb-6 text-white flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.1)' }}>🏆</div>
            <div>
              <div className="font-bold font-display text-lg">Best Six Total</div>
              <div className="text-white/70 text-sm">{division}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-display text-amber-400">{bestSix}</div>
            <div className="text-white/50 text-sm">points</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <BarChart3 size={18} />, label: 'Avg Score', value: `${avgScore}%`, color: '#3b82f6' },
          { icon: <BookOpen size={18} />, label: 'Tests Taken', value: results.length.toString(), color: '#10b981' },
          { icon: <Clock size={18} />, label: 'Study Time', value: `${Math.round(totalTime / 3600)}h`, color: '#8b5cf6' },
          { icon: <Zap size={18} />, label: 'Subjects Active', value: subjectStats.length.toString(), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}20`, color: s.color }}>
              {s.icon}
            </div>
            <div className="font-bold font-display text-xl" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Score trend chart */}
      {chartData.length > 1 && (
        <div className="card rounded-2xl p-4 mb-6">
          <h2 className="font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>Score Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v: number) => [`${v}%`, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="#e9ae34" strokeWidth={2.5} dot={{ fill: '#e9ae34', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Predicted MSCE Table */}
      <div className="card rounded-2xl overflow-hidden mb-6">
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Predicted MSCE Results</h2>
        </div>
        {subjectStats.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No test data yet. Take some tests to see predictions.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Subject</th>
                <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Grade</th>
                <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Avg Score</th>
                <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Trend</th>
                <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Tests</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map(s => {
                const subj = getSubject(s.subject as any)
                return (
                  <tr key={s.subject} className="border-t hover:bg-[var(--surface-2)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{subj.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{subj.label}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-bold text-lg font-display ${gradeToColor(s.grade)}`}>{s.grade}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${s.avgScore}%`, background: subj.color }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.avgScore}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {s.trend === 'up' ? <TrendingUp size={16} className="mx-auto text-green-500" /> :
                       s.trend === 'down' ? <TrendingDown size={16} className="mx-auto text-red-500" /> :
                       <Minus size={16} className="mx-auto" style={{ color: 'var(--text-muted)' }} />}
                    </td>
                    <td className="p-3 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{s.testCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Weak Topics */}
      {topWeakTopics.length > 0 && (
        <div className="card rounded-2xl p-4">
          <h2 className="font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>Topics to Improve</h2>
          <div className="space-y-2">
            {topWeakTopics.map(([topic, count]) => (
              <div key={topic} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{topic}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Missed {count}x</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, count * 20)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
