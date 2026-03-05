import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, ArrowLeft, Star, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type SubjectType } from '../lib/supabase'
import { SUBJECTS, AVATAR_COLORS, BANNER_PRESETS, cn } from '../lib/utils'
import { toast } from 'sonner'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
}

const STEPS = ['Avatar', 'Subjects', 'Priority', 'School', 'Test Day', 'Banner']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [avatarColor, setAvatarColor] = useState('#1f3d5d')
  const [subjects, setSubjects] = useState<SubjectType[]>([])
  const [prioritySubjects, setPrioritySubjects] = useState<SubjectType[]>([])
  const [school, setSchool] = useState('')
  const [testDay, setTestDay] = useState('saturday')
  const [banner, setBanner] = useState('navy-wave')

  const canNext = () => {
    if (step === 1) return subjects.length >= 6
    if (step === 2) return prioritySubjects.length === 2
    if (step === 3) return school.trim().length > 0
    return true
  }

  const toggleSubject = (s: SubjectType) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
    setPrioritySubjects(prev => prev.filter(x => subjects.includes(x) || x !== s))
  }

  const togglePriority = (s: SubjectType) => {
    setPrioritySubjects(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s)
      if (prev.length >= 2) { toast.error('Pick exactly 2 priority subjects'); return prev }
      return [...prev, s]
    })
  }

  const finish = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      avatar_color: avatarColor,
      subjects,
      priority_subjects: prioritySubjects,
      school_name: school,
      preferred_test_day: testDay,
      banner_preset: banner,
      onboarding_completed: true,
    }).eq('user_id', user.id)
    if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
    await refreshProfile()
    navigate('/dashboard')
    setSaving(false)
  }

  const avatarInitial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()

  const STEP_CONTENT = [
    // Step 0: Avatar color
    <div key={0} className="animate-fade-in">
      <h2 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Choose your color</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Pick a color for your profile avatar</p>
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl transition-all duration-300"
          style={{ background: avatarColor }}>
          {avatarInitial}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
        {AVATAR_COLORS.map(c => (
          <button key={c.value} onClick={() => setAvatarColor(c.value)}
            className={cn('w-full aspect-square rounded-2xl transition-all duration-200 relative', avatarColor === c.value && 'ring-4 ring-offset-2 ring-amber-400 scale-95')}
            style={{ background: c.value }}>
            {avatarColor === c.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="text-white drop-shadow" size={28} />
              </div>
            )}
            <span className="sr-only">{c.label}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Subjects
    <div key={1} className="animate-fade-in">
      <h2 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>What subjects do you take?</h2>
      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Select at least 6 subjects you're studying for MSCE</p>
      <p className="text-xs font-semibold mb-6" style={{ color: subjects.length >= 6 ? '#16a34a' : '#e9ae34' }}>
        {subjects.length} selected {subjects.length < 6 ? `(need ${6 - subjects.length} more)` : '✓ minimum met'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {SUBJECTS.map(s => (
          <button key={s.value} onClick={() => toggleSubject(s.value)}
            className={cn('subject-chip', subjects.includes(s.value) && 'selected')}>
            <span>{s.emoji}</span>
            <span className="truncate">{s.label}</span>
            {subjects.includes(s.value) && <CheckCircle size={14} className="ml-auto flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Priority subjects
    <div key={2} className="animate-fade-in">
      <h2 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Pick 2 priority subjects</h2>
      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>These will be featured in your weekly tests and dashboard</p>
      <p className="text-xs font-semibold mb-6" style={{ color: prioritySubjects.length === 2 ? '#16a34a' : '#e9ae34' }}>
        {prioritySubjects.length}/2 selected
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {subjects.map(sv => {
          const s = SUBJECTS.find(x => x.value === sv)!
          return (
            <button key={sv} onClick={() => togglePriority(sv)}
              className={cn('subject-chip relative', prioritySubjects.includes(sv) && 'selected')}>
              <span>{s.emoji}</span>
              <span className="truncate">{s.label}</span>
              {prioritySubjects.includes(sv) && <Star size={14} className="ml-auto flex-shrink-0 fill-current" />}
            </button>
          )
        })}
      </div>
    </div>,

    // Step 3: School
    <div key={3} className="animate-fade-in max-w-sm mx-auto">
      <h2 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>What school do you go to?</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>This helps build your school's leaderboard position</p>
      <input value={school} onChange={e => setSchool(e.target.value)} className="input text-center text-lg mb-4" placeholder="e.g. Henry Henderson School of Excellence" />
      {school && (
        <div className="p-4 rounded-xl text-center border animate-scale-in" style={{ borderColor: '#e9ae34', background: 'rgba(233,174,52,0.05)' }}>
          <div className="text-2xl mb-1">🏫</div>
          <div className="font-semibold font-display" style={{ color: 'var(--text-primary)' }}>{school}</div>
        </div>
      )}
    </div>,

    // Step 4: Test day
    <div key={4} className="animate-fade-in max-w-sm mx-auto">
      <h2 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>When do you want to take weekly tests?</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Pick your preferred test day each week</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAYS.map(d => (
          <button key={d} onClick={() => setTestDay(d)}
            className={cn('py-3 px-2 rounded-xl text-sm font-semibold transition-all capitalize', testDay === d ? 'text-white' : '')}
            style={testDay === d ? { background: '#1f3d5d', color: 'white' } : { background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
    </div>,

    // Step 5: Banner
    <div key={5} className="animate-fade-in">
      <h2 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Choose your profile banner</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Personalise your MSCE Prep profile</p>
      <div className="grid grid-cols-2 gap-3">
        {BANNER_PRESETS.map(b => (
          <button key={b.value} onClick={() => setBanner(b.value)}
            className={cn('relative h-20 rounded-xl overflow-hidden transition-all', banner === b.value && 'ring-4 ring-offset-2 ring-amber-400')}>
            <div className="absolute inset-0" style={{ background: b.gradient }} />
            <div className="absolute inset-0 flex items-end justify-start p-2">
              <span className="text-white text-xs font-semibold drop-shadow">{b.label}</span>
            </div>
            {banner === b.value && (
              <div className="absolute top-2 right-2">
                <CheckCircle size={16} className="text-white drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: '#e9ae34' }}>🎓</div>
          <span className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>MSCE Prep</span>
        </div>
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                i < step ? 'text-white' : i === step ? 'text-white' : '',
              )} style={{ background: i < step ? '#16a34a' : i === step ? '#1f3d5d' : 'var(--surface-2)', color: i >= step ? 'var(--text-muted)' : undefined }}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-0.5 rounded-full" style={{ background: i < step ? '#16a34a' : 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 max-w-2xl mx-auto w-full overflow-y-auto pb-32">
        {STEP_CONTENT[step]}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn btn-outline px-6">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn btn-primary flex-1 py-3">
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="btn btn-accent flex-1 py-3 font-bold">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <>Start Preparing <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
