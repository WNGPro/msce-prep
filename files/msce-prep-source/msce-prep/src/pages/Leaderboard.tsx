import React, { useEffect, useState } from 'react'
import { Trophy, Crown, Medal } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

interface Entry {
  id: string
  user_id: string
  school_name: string
  total_score: number
  tests_completed: number
  rank: number | null
  full_name?: string
  avatar_color?: string
}

export default function Leaderboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<'individual' | 'school'>('individual')
  const [entries, setEntries] = useState<Entry[]>([])
  const [schoolEntries, setSchoolEntries] = useState<{ school_name: string; total_score: number; member_count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<Entry | null>(null)

  useEffect(() => { fetchData() }, [profile])

  async function fetchData() {
    if (!profile) return
    const { data } = await supabase
      .from('school_leaderboard')
      .select('*, profiles(full_name, avatar_color)')
      .order('total_score', { ascending: false })
      .limit(100)

    if (data) {
      const mapped: Entry[] = data.map((e: any) => ({
        ...e,
        full_name: e.profiles?.full_name,
        avatar_color: e.profiles?.avatar_color || '#1f3d5d'
      }))
      setEntries(mapped)
      setMyRank(mapped.find(e => e.user_id === profile.user_id) || null)

      const schoolMap: Record<string, { total_score: number; count: number }> = {}
      mapped.forEach(e => {
        if (!schoolMap[e.school_name]) schoolMap[e.school_name] = { total_score: 0, count: 0 }
        schoolMap[e.school_name].total_score += e.total_score
        schoolMap[e.school_name].count++
      })
      setSchoolEntries(
        Object.entries(schoolMap)
          .map(([school_name, v]) => ({ school_name, total_score: v.total_score, member_count: v.count }))
          .sort((a, b) => b.total_score - a.total_score)
      )
    }
    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={18} className="text-amber-400" />
    if (rank === 2) return <Medal size={18} className="text-gray-400" />
    if (rank === 3) return <Medal size={18} style={{ color: '#b45309' }} />
    return <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>#{rank}</span>
  }

  const top3 = entries.slice(0, 3)
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumHeights = ['h-24', 'h-32', 'h-20']
  const podiumLabels = [2, 1, 3]
  const podiumColors = ['#9ca3af', '#e9ae34', '#b45309']

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Leaderboard</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>See how you rank against students across Malawi</p>

      {myRank && (
        <div className="rounded-2xl p-4 mb-6 text-white flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background: myRank.avatar_color, color: 'white' }}>
            {myRank.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold font-display">Your Position</div>
            <div className="text-white/70 text-sm truncate">{myRank.school_name}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold font-display text-amber-400">#{myRank.rank || entries.findIndex(e => e.user_id === profile?.user_id) + 1}</div>
            <div className="text-white/50 text-sm">{myRank.total_score} pts</div>
          </div>
        </div>
      )}

      <div className="flex rounded-xl p-1 mb-6 w-fit" style={{ background: 'var(--surface-2)' }}>
        {(['individual', 'school'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
            style={tab === t ? { color: 'var(--text-primary)' } : {}}>
            {t === 'school' ? 'Schools' : 'Individual'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
      ) : tab === 'individual' ? (
        <>
          {entries.length >= 3 && (
            <div className="flex items-end justify-center gap-6 mb-8 pt-4">
              {podium.map((entry, i) => (
                <div key={entry.id} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border-4"
                    style={{ background: entry.avatar_color, color: 'white', borderColor: podiumColors[i] }}>
                    {entry.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-xs font-semibold text-center max-w-20 truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.full_name?.split(' ')[0] || 'Student'}
                  </div>
                  <div className="text-xs font-bold" style={{ color: podiumColors[i] }}>{entry.total_score} pts</div>
                  <div className={cn('w-20 rounded-t-2xl flex items-start justify-center pt-3', podiumHeights[i])}
                    style={{ background: podiumColors[i] }}>
                    <span className="text-white font-bold text-xl font-display">{podiumLabels[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {entries.map((entry, i) => {
              const rank = i + 1
              const isMe = entry.user_id === profile?.user_id
              return (
                <div key={entry.id}
                  className={cn('flex items-center gap-3 p-4 rounded-2xl border transition-all', isMe && 'scale-[1.01]')}
                  style={{ background: isMe ? 'rgba(233,174,52,0.06)' : 'var(--surface)', borderColor: isMe ? '#e9ae34' : 'var(--border)' }}>
                  <div className="w-8 flex items-center justify-center flex-shrink-0">{getRankIcon(rank)}</div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: entry.avatar_color, color: 'white' }}>
                    {entry.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.full_name || 'Student'}{isMe && <span className="text-amber-500 ml-1">(You)</span>}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{entry.school_name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>{entry.total_score}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.tests_completed} tests</div>
                  </div>
                </div>
              )
            })}
            {entries.length === 0 && (
              <div className="text-center py-16">
                <Trophy size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>No rankings yet</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Complete tests to appear on the leaderboard!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {schoolEntries.map((school, i) => {
            const isMySchool = school.school_name === profile?.school_name
            return (
              <div key={school.school_name}
                className="flex items-center gap-4 p-4 rounded-2xl border"
                style={{ background: isMySchool ? 'rgba(233,174,52,0.06)' : 'var(--surface)', borderColor: isMySchool ? '#e9ae34' : 'var(--border)' }}>
                <div className="w-8 flex items-center justify-center flex-shrink-0">{getRankIcon(i + 1)}</div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--surface-2)' }}>🏫</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {school.school_name}{isMySchool && <span className="text-amber-500 ml-1">(Your school)</span>}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{school.member_count} student{school.member_count !== 1 ? 's' : ''}</div>
                </div>
                <div className="font-bold font-display text-lg" style={{ color: 'var(--text-primary)' }}>{school.total_score}</div>
              </div>
            )
          })}
          {schoolEntries.length === 0 && (
            <div className="text-center py-16">
              <p style={{ color: 'var(--text-muted)' }}>No school data yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
