import React, { useState } from 'react'
import { Edit2, Star, BookOpen, Settings as SettingsIcon, Award, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AVATAR_COLORS, BANNER_PRESETS, SUBJECTS, getSubject, formatDate, cn } from '../lib/utils'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const BADGES = [
  { id: 'first_steps', label: 'First Steps', emoji: '👣', desc: 'Complete your first test', condition: (tests: number) => tests >= 1 },
  { id: 'week_warrior', label: 'Week Warrior', emoji: '🔥', desc: 'Complete 7 tests in a week', condition: (tests: number) => tests >= 7 },
  { id: 'paper_master', label: 'Paper Master', emoji: '📄', desc: 'View 10 past papers', condition: (tests: number) => tests >= 10 },
  { id: 'perfect_score', label: 'Perfect Score', emoji: '💯', desc: 'Score 100% on any test', condition: () => false },
  { id: 'contributor', label: 'Contributor', emoji: '🤝', desc: 'Upload an approved paper', condition: () => false },
  { id: 'top_student', label: 'Top Student', emoji: '🏆', desc: 'Reach top 10 on leaderboard', condition: () => false },
  { id: 'streak_master', label: 'Streak Master', emoji: '⚡', desc: 'Maintain a 30-day streak', condition: () => false },
  { id: 'builder', label: 'Builder', emoji: '🔨', desc: 'Create 5 flashcards', condition: () => false },
  { id: 'pioneer', label: 'Pioneer', emoji: '🌟', desc: 'One of the first 100 users', condition: () => false },
]

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'badges' | 'subjects' | 'edit'>('badges')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    school_name: profile?.school_name || '',
    avatar_color: profile?.avatar_color || '#1f3d5d',
    banner_preset: profile?.banner_preset || 'navy-wave',
  })

  const banner = BANNER_PRESETS.find(b => b.value === (editing ? form.banner_preset : profile?.banner_preset)) || BANNER_PRESETS[0]
  const avatarColor = editing ? form.avatar_color : (profile?.avatar_color || '#1f3d5d')
  const initial = (profile?.full_name || 'U')[0].toUpperCase()

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      school_name: form.school_name,
      avatar_color: form.avatar_color,
      banner_preset: form.banner_preset,
    }).eq('user_id', profile.user_id)
    if (error) { toast.error(error.message); setSaving(false); return }
    await refreshProfile()
    setEditing(false)
    toast.success('Profile updated!')
    setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Banner */}
      <div className="relative h-36 lg:h-48" style={{ background: banner.gradient }}>
        {editing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {BANNER_PRESETS.map(b => (
                <button key={b.value} onClick={() => setForm(f => ({ ...f, banner_preset: b.value }))}
                  className={cn('w-12 h-8 rounded-lg overflow-hidden border-2 transition-all', form.banner_preset === b.value ? 'border-white scale-110' : 'border-transparent')}>
                  <div className="w-full h-full" style={{ background: b.gradient }} />
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => { setEditing(!editing); setTab('edit') }}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
          <Edit2 size={12} /> {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Avatar */}
      <div className="px-4 lg:px-6">
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-[var(--background)] flex items-center justify-center text-3xl font-bold"
              style={{ background: avatarColor, color: 'white' }}>
              {initial}
            </div>
            {editing && (
              <div className="absolute -bottom-2 -right-2 grid grid-cols-3 gap-1 p-1.5 rounded-xl shadow-xl" style={{ background: 'var(--surface)' }}>
                {AVATAR_COLORS.map(c => (
                  <button key={c.value} onClick={() => setForm(f => ({ ...f, avatar_color: c.value }))}
                    className={cn('w-6 h-6 rounded-full border-2 transition-all', form.avatar_color === c.value ? 'border-amber-400 scale-110' : 'border-transparent')}
                    style={{ background: c.value }} />
                ))}
              </div>
            )}
          </div>
          {profile?.is_premium && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(233,174,52,0.15)', color: '#92600a' }}>
              <Star size={12} className="text-amber-500 fill-current" /> Premium
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-3 mb-4">
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input w-full" placeholder="Full name" />
            <input value={form.school_name} onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))} className="input w-full" placeholder="School name" />
            <button onClick={saveProfile} disabled={saving} className="btn btn-accent px-6 py-2.5 font-bold">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save Changes</>}
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'Student'}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {profile?.school_name && <span>🏫 {profile.school_name}</span>}
              <span>📅 Joined {formatDate(profile?.created_at || '')}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-6 w-fit" style={{ background: 'var(--surface-2)' }}>
          {(['badges', 'subjects'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
              style={tab === t ? { color: 'var(--text-primary)' } : {}}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'badges' && (
          <div className="grid grid-cols-3 gap-3 pb-8">
            {BADGES.map(badge => {
              const earned = badge.condition(0)
              return (
                <div key={badge.id} className={cn('card rounded-2xl p-4 text-center', !earned && 'opacity-40')}>
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <div className="font-semibold text-xs font-display" style={{ color: 'var(--text-primary)' }}>{badge.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{badge.desc}</div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'subjects' && (
          <div className="pb-8">
            {(profile?.priority_subjects?.length ?? 0) > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-muted)' }}>PRIORITY SUBJECTS</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile?.priority_subjects ?? []).map(sv => {
                    const s = getSubject(sv)
                    return (
                      <div key={sv} className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: `${s.color}10`, borderColor: `${s.color}40` }}>
                        <span>{s.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: s.color }}>{s.label}</span>
                        <Star size={12} className="fill-current" style={{ color: s.color }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-muted)' }}>ALL SUBJECTS</h3>
            <div className="flex flex-wrap gap-2">
              {(profile?.subjects || []).map(sv => {
                const s = getSubject(sv)
                return (
                  <div key={sv} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
                    <span>{s.emoji}</span>
                    <span className="text-sm">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
