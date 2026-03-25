import React, { useEffect, useState } from 'react'
import { Trophy, Flame, Crown, Medal, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { xpToLevel, levelTitle } from '../lib/useXP'

interface LeaderEntry {
  user_id: string
  school_name: string
  total_score: number
  total_xp: number
  tests_completed: number
  rank: number
  profiles: { full_name: string; current_streak: number; avatar_color: string }
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'individual' | 'school'>('individual')
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [schoolEntries, setSchoolEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myEntry, setMyEntry] = useState<LeaderEntry | null>(null)

  useEffect(() => { fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('school_leaderboard')
      .select('*, profiles(full_name, current_streak, avatar_color)')
      .order('total_xp', { ascending: false })
      .limit(50)

    const ranked = (data || []).map((e: any, i: number) => ({ ...e, rank: i + 1 }))
    setEntries(ranked)
    if (user) setMyEntry(ranked.find((e: any) => e.user_id === user.id) || null)

    // Aggregate school rankings
    const schoolMap: Record<string, { school: string; totalXP: number; members: number }> = {}
    for (const e of ranked) {
      if (!e.school_name) continue
      if (!schoolMap[e.school_name]) schoolMap[e.school_name] = { school: e.school_name, totalXP: 0, members: 0 }
      schoolMap[e.school_name].totalXP += e.total_xp || 0
      schoolMap[e.school_name].members++
    }
    setSchoolEntries(Object.values(schoolMap).sort((a, b) => b.totalXP - a.totalXP).map((s, i) => ({ ...s, rank: i + 1 })))
    setLoading(false)
  }

  const initial = (name: string) => (name || 'S')[0].toUpperCase()

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={16} style={{ color: '#f59e0b' }} />
    if (rank === 2) return <Medal size={16} style={{ color: '#94a3b8' }} />
    if (rank === 3) return <Medal size={16} style={{ color: '#b45309' }} />
    return <span className="text-xs font-bold w-4 text-center" style={{ color: 'var(--text-muted)' }}>#{rank}</span>
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Leaderboard</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Ranked by XP earned from study activity</p>

        {/* My position */}
        {myEntry && (
          <div className="card rounded-2xl p-4 mb-5"
            style={{ border: '2px solid #e9ae34', background: 'rgba(233,174,52,0.05)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#e9ae34' }}>YOUR POSITION</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: myEntry.profiles?.avatar_color || '#1f3d5d' }}>
                {initial(myEntry.profiles?.full_name)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {myEntry.profiles?.full_name || 'You'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {myEntry.school_name} · Level {xpToLevel(myEntry.total_xp || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg" style={{ color: '#e9ae34' }}>#{myEntry.rank}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{myEntry.total_xp || 0} XP</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: 'var(--surface)' }}>
          <button onClick={() => setTab('individual')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'individual' ? { background: '#1f3d5d', color: 'white' } : { color: 'var(--text-muted)' }}>
            👤 Students
          </button>
          <button onClick={() => setTab('school')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'school' ? { background: '#1f3d5d', color: 'white' } : { color: 'var(--text-muted)' }}>
            🏫 Schools
          </button>
        </div>

        {loading ? (
          <div className="grid gap-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)}
          </div>
        ) : tab === 'individual' ? (
          <>
            {/* Top 3 podium */}
            {entries.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-6">
                {/* 2nd */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: entries[1]?.profiles?.avatar_color || '#1f3d5d', border: '2px solid #94a3b8' }}>
                    {initial(entries[1]?.profiles?.full_name)}
                  </div>
                  <div className="w-20 rounded-t-xl flex flex-col items-center py-3"
                    style={{ background: 'var(--surface)', height: '72px' }}>
                    <Medal size={14} style={{ color: '#94a3b8' }} />
                    <p className="text-xs font-bold mt-1 truncate w-full text-center px-1" style={{ color: 'var(--text-primary)' }}>
                      {entries[1]?.profiles?.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entries[1]?.total_xp || 0} XP</p>
                  </div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-base"
                    style={{ background: entries[0]?.profiles?.avatar_color || '#1f3d5d', border: '3px solid #f59e0b', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
                    {initial(entries[0]?.profiles?.full_name)}
                  </div>
                  <div className="w-24 rounded-t-xl flex flex-col items-center py-3"
                    style={{ background: 'rgba(233,174,52,0.15)', border: '1px solid rgba(233,174,52,0.3)', height: '88px' }}>
                    <Crown size={16} style={{ color: '#f59e0b' }} />
                    <p className="text-xs font-bold mt-1 truncate w-full text-center px-1" style={{ color: 'var(--text-primary)' }}>
                      {entries[0]?.profiles?.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: '#e9ae34' }}>{entries[0]?.total_xp || 0} XP</p>
                  </div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: entries[2]?.profiles?.avatar_color || '#1f3d5d', border: '2px solid #b45309' }}>
                    {initial(entries[2]?.profiles?.full_name)}
                  </div>
                  <div className="w-20 rounded-t-xl flex flex-col items-center py-3"
                    style={{ background: 'var(--surface)', height: '60px' }}>
                    <Medal size={14} style={{ color: '#b45309' }} />
                    <p className="text-xs font-bold mt-1 truncate w-full text-center px-1" style={{ color: 'var(--text-primary)' }}>
                      {entries[2]?.profiles?.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entries[2]?.total_xp || 0} XP</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="grid gap-2">
              {entries.map(e => {
                const isMe = e.user_id === user?.id
                const level = xpToLevel(e.total_xp || 0)
                return (
                  <div key={e.user_id}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{
                      background: isMe ? 'rgba(233,174,52,0.08)' : 'var(--surface)',
                      border: `1.5px solid ${isMe ? 'rgba(233,174,52,0.3)' : 'var(--border)'}`
                    }}>
                    <div className="w-6 flex items-center justify-center flex-shrink-0">
                      {rankIcon(e.rank)}
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: e.profiles?.avatar_color || '#1f3d5d' }}>
                      {initial(e.profiles?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {e.profiles?.full_name || 'Student'} {isMe && '(you)'}
                        </p>
                        {(e.profiles?.current_streak || 0) > 2 && (
                          <div className="flex items-center gap-0.5">
                            <Flame size={11} style={{ color: '#e9ae34' }} />
                            <span className="text-xs" style={{ color: '#e9ae34' }}>{e.profiles.current_streak}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {e.school_name} · Lv.{level} {levelTitle(level)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: isMe ? '#e9ae34' : 'var(--text-primary)' }}>
                        {e.total_xp || 0}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>XP</p>
                    </div>
                  </div>
                )
              })}
              {entries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">🏆</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No rankings yet</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Complete a test to appear on the leaderboard</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid gap-2">
            {schoolEntries.map(s => (
              <div key={s.school} className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="w-6 flex items-center justify-center">{rankIcon(s.rank)}</div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'var(--surface-2)' }}>🏫</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.school}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.members} student{s.members !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.totalXP}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>total XP</p>
                </div>
              </div>
            ))}
            {schoolEntries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🏫</p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No schools yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Schools appear once students register and complete tests</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
