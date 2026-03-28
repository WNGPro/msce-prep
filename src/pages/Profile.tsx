import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Loader2, Camera, Edit2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUBJECTS, AVATAR_COLORS, BANNER_PRESETS, cn } from '../lib/utils'
import { xpToLevel, xpToNextLevel, levelTitle } from '../lib/useXP'
import { toast } from 'sonner'
import type { SubjectType } from '../lib/supabase'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string,string> = { monday:'Mon',tuesday:'Tue',wednesday:'Wed',thursday:'Thu',friday:'Fri',saturday:'Sat',sunday:'Sun' }

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [avatarColor, setAvatarColor] = useState('#1f3d5d')
  const [bannerPreset, setBannerPreset] = useState('navy-wave')
  const [testDay, setTestDay] = useState('saturday')
  const [subjects, setSubjects] = useState<SubjectType[]>([])
  const [prioritySubjects, setPrioritySubjects] = useState<SubjectType[]>([])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setSchoolName(profile.school_name || '')
      setAvatarColor(profile.avatar_color || '#1f3d5d')
      setBannerPreset(profile.banner_preset || 'navy-wave')
      setTestDay(profile.preferred_test_day || 'saturday')
      setSubjects(profile.subjects || [])
      setPrioritySubjects(profile.priority_subjects || [])
    }
  }, [profile])

  const initial = (profile?.full_name || user?.email || 'S')[0].toUpperCase()
  const banner = BANNER_PRESETS.find(b => b.value === (editing ? bannerPreset : profile?.banner_preset)) || BANNER_PRESETS[0]
  const totalXP = profile?.total_xp || 0
  const streak = profile?.current_streak || 0
  const level = xpToLevel(totalXP)
  const { current: xpCurrent, needed: xpNeeded, percent: xpPercent } = xpToNextLevel(totalXP)

  const toggleSubject = (s: SubjectType) => {
    setSubjects(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
      setPrioritySubjects(p => p.filter(x => next.includes(x)))
      return next
    })
  }

  const togglePriority = (s: SubjectType) => {
    setPrioritySubjects(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s)
      if (prev.length >= 2) { toast.error('Max 2 priority subjects'); return prev }
      return [...prev, s]
    })
  }

  async function save() {
    if (!user) return
    if (!fullName.trim()) { toast.error('Name is required'); return }
    if (subjects.length < 6) { toast.error('Select at least 6 subjects'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      school_name: schoolName.trim(),
      avatar_color: avatarColor,
      banner_preset: bannerPreset,
      preferred_test_day: testDay,
      subjects,
      priority_subjects: prioritySubjects,
    }).eq('user_id', user.id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    await refreshProfile()
    toast.success('Profile updated ✓')
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="max-w-xl mx-auto">

        {/* Banner */}
        <div className="relative h-36 overflow-hidden" style={{ background: banner.gradient }}>
          <div className="absolute inset-0" style={{ background: banner.gradient }} />
          {editing && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 flex-wrap p-4"
              style={{ background: 'rgba(0,0,0,0.4)' }}>
              {BANNER_PRESETS.map(b => (
                <button key={b.value} onClick={() => setBannerPreset(b.value)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: bannerPreset === b.value ? '#e9ae34' : 'rgba(255,255,255,0.2)',
                    color: bannerPreset === b.value ? '#1f3d5d' : 'white',
                    outline: bannerPreset === b.value ? '2px solid white' : 'none'
                  }}>
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Avatar + actions */}
        <div className="px-4 relative">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 shadow-lg"
                style={{ background: editing ? avatarColor : profile?.avatar_color || '#1f3d5d', borderColor: 'var(--background)' }}>
                {initial}
              </div>
              {editing && (
                <div className="mt-2 flex gap-1.5 flex-wrap max-w-[160px]">
                  {AVATAR_COLORS.map(c => (
                    <button key={c.value} onClick={() => setAvatarColor(c.value)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{
                        background: c.value,
                        outline: avatarColor === c.value ? '2px solid #e9ae34' : 'none',
                        outlineOffset: '2px',
                        transform: avatarColor === c.value ? 'scale(0.85)' : 'scale(1)'
                      }} />
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => editing ? save() : setEditing(true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: editing ? '#e9ae34' : 'var(--surface)', color: editing ? '#1f3d5d' : 'var(--text-secondary)', border: editing ? 'none' : '1.5px solid var(--border)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? <Check size={14} /> : <Edit2 size={14} />}
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          {/* Name + school */}
          {editing ? (
            <div className="grid gap-3 mb-5">
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>DISPLAY NAME</label>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>SCHOOL</label>
                <input className="input" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Your school name" />
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <h2 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'Student'}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>🏫 {profile?.school_name || 'No school set'}</p>
            </div>
          )}

          {/* XP card */}
          <div className="card rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: '#e9ae34', color: '#1f3d5d' }}>{level}</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{levelTitle(level)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{totalXP} XP · 🔥 {streak} day streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{xpCurrent}/{xpNeeded} XP</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>to Level {level + 1}</p>
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, #e9ae34, #f5c842)' }} />
            </div>
          </div>

          {/* Subjects */}
          <div className="card rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold mb-3 tracking-wider" style={{ color: 'var(--text-muted)' }}>
              SUBJECTS {editing && <span style={{ color: subjects.length >= 6 ? '#16a34a' : '#e9ae34' }}>({subjects.length} selected{subjects.length < 6 ? ` — need ${6 - subjects.length} more` : ' ✓'})</span>}
            </p>
            {editing ? (
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(s => {
                  const selected = subjects.includes(s.value)
                  const isPriority = prioritySubjects.includes(s.value)
                  return (
                    <button key={s.value} onClick={() => toggleSubject(s.value)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                      style={{
                        background: selected ? `${s.color}15` : 'var(--surface-2)',
                        border: `1.5px solid ${selected ? s.color : 'var(--border)'}`,
                        color: 'var(--text-primary)'
                      }}>
                      <span>{s.emoji}</span>
                      <span className="flex-1 truncate text-xs">{s.label}</span>
                      {selected && (
                        <button onClick={e => { e.stopPropagation(); togglePriority(s.value) }}
                          className="text-base" title="Set as priority">
                          {isPriority ? '⭐' : '☆'}
                        </button>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.subjects || []).map(sv => {
                  const s = SUBJECTS.find(x => x.value === sv)
                  const isPriority = (profile?.priority_subjects || []).includes(sv)
                  return (
                    <span key={sv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: isPriority ? '1.5px solid #e9ae34' : '1.5px solid var(--border)' }}>
                      {s?.emoji} {s?.label} {isPriority && '⭐'}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Test day */}
          {editing && (
            <div className="card rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold mb-3 tracking-wider" style={{ color: 'var(--text-muted)' }}>WEEKLY TEST DAY</p>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map(d => (
                  <button key={d} onClick={() => setTestDay(d)}
                    className="py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={testDay === d
                      ? { background: '#1f3d5d', color: '#e9ae34' }
                      : { background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cancel button */}
          {editing && (
            <button onClick={() => { setEditing(false); }}
              className="w-full py-3 rounded-2xl text-sm font-semibold mb-4"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
              Cancel
            </button>
          )}

          {/* Stats when not editing */}
          {!editing && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Tests', value: profile?.total_xp ? Math.floor(profile.total_xp / 50) : 0 },
                { label: 'Best Streak', value: `${profile?.longest_streak || 0}d` },
                { label: 'Level', value: level },
              ].map(s => (
                <div key={s.label} className="card rounded-2xl p-3 text-center">
                  <p className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
