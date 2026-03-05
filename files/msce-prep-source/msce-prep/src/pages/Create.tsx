import React, { useState, useEffect } from 'react'
import { Plus, Sparkles, Lock, BookOpen, ClipboardList, X, Save, Image, ChevronDown, ChevronUp, Loader2, Eye, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type SubjectType, type Flashcard, type Exercise } from '../lib/supabase'
import { SUBJECTS, SUBJECT_TOPICS, getSubject, cn } from '../lib/utils'
import { saveFlashcardOffline, saveExerciseOffline } from '../lib/offline'
import { toast } from 'sonner'

type Mode = 'home' | 'flashcard' | 'quiz'

interface FlashcardForm {
  subject: SubjectType | ''
  topic: string
  question: string
  answer: string
  explanation: string
  is_public: boolean
}

interface QuizForm {
  subject: SubjectType | ''
  topic: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  is_public: boolean
}

export default function Create() {
  const { profile } = useAuth()
  const [mode, setMode] = useState<Mode>('home')
  const [tab, setTab] = useState<'create' | 'my-items'>('create')
  const [saving, setSaving] = useState(false)
  const [myFlashcards, setMyFlashcards] = useState<Flashcard[]>([])
  const [myExercises, setMyExercises] = useState<Exercise[]>([])

  const [fc, setFc] = useState<FlashcardForm>({
    subject: '', topic: '', question: '', answer: '', explanation: '', is_public: false
  })
  const [qz, setQz] = useState<QuizForm>({
    subject: '', topic: '', question: '', options: ['', '', '', ''],
    correct_answer: '', explanation: '', is_public: false
  })

  useEffect(() => {
    if (profile && tab === 'my-items') fetchMyItems()
  }, [profile, tab, mode])

  async function fetchMyItems() {
    if (!profile) return
    const [{ data: fcs }, { data: exs }] = await Promise.all([
      supabase.from('flashcards').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }),
      supabase.from('exercises').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false })
    ])
    setMyFlashcards(fcs as Flashcard[] || [])
    setMyExercises(exs as Exercise[] || [])
  }

  const saveFlashcard = async () => {
    if (!profile || !fc.subject || !fc.question || !fc.answer) {
      toast.error('Please fill in subject, question, and answer'); return
    }
    setSaving(true)
    const item = {
      user_id: profile.user_id, subject: fc.subject, topic: fc.topic || null,
      question: fc.question, answer: fc.answer, explanation: fc.explanation || null,
      is_public: fc.is_public, status: fc.is_public ? 'pending' : 'approved',
      created_at: new Date().toISOString()
    }
    const { error } = await supabase.from('flashcards').insert(item)
    if (error) { toast.error(error.message); setSaving(false); return }
    await saveFlashcardOffline({ ...item, id: Date.now().toString() })
    toast.success(fc.is_public ? 'Flashcard submitted for review!' : 'Flashcard saved!')
    setFc({ subject: '', topic: '', question: '', answer: '', explanation: '', is_public: false })
    setMode('home')
    setSaving(false)
  }

  const saveQuiz = async () => {
    if (!profile || !qz.subject || !qz.question || !qz.correct_answer) {
      toast.error('Please fill in subject, question, and correct answer'); return
    }
    setSaving(true)
    const item = {
      user_id: profile.user_id, subject: qz.subject, topic: qz.topic || null,
      question: qz.question, answer: qz.correct_answer,
      options: qz.options.filter(o => o.trim()),
      explanation: qz.explanation || null,
      is_public: qz.is_public, status: qz.is_public ? 'pending' : 'approved',
      created_at: new Date().toISOString()
    }
    const { error } = await supabase.from('exercises').insert(item)
    if (error) { toast.error(error.message); setSaving(false); return }
    await saveExerciseOffline({ ...item, id: Date.now().toString() })
    toast.success(qz.is_public ? 'Exercise submitted for review!' : 'Exercise saved!')
    setQz({ subject: '', topic: '', question: '', options: ['', '', '', ''], correct_answer: '', explanation: '', is_public: false })
    setMode('home')
    setSaving(false)
  }

  const topics = (fc.subject || qz.subject) ? (SUBJECT_TOPICS[(fc.subject || qz.subject) as SubjectType] || []) : []

  if (mode === 'flashcard' || mode === 'quiz') {
    const isFlashcard = mode === 'flashcard'
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => setMode('home')} className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <X size={16} /> Cancel
        </button>
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
          {isFlashcard ? 'Create Flashcard' : 'Create Quiz Exercise'}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {isFlashcard ? 'Create a flashcard to study key concepts' : 'Build a practice question with multiple choice answers'}
        </p>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Subject *</label>
            <select value={isFlashcard ? fc.subject : qz.subject}
              onChange={e => isFlashcard ? setFc(p => ({ ...p, subject: e.target.value as SubjectType, topic: '' })) : setQz(p => ({ ...p, subject: e.target.value as SubjectType, topic: '' }))}
              className="input w-full">
              <option value="">Select subject</option>
              {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
            </select>
          </div>

          {/* Topic */}
          {topics.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Topic</label>
              <select value={isFlashcard ? fc.topic : qz.topic}
                onChange={e => isFlashcard ? setFc(p => ({ ...p, topic: e.target.value })) : setQz(p => ({ ...p, topic: e.target.value }))}
                className="input w-full">
                <option value="">Select topic (optional)</option>
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Question *</label>
            <textarea value={isFlashcard ? fc.question : qz.question}
              onChange={e => isFlashcard ? setFc(p => ({ ...p, question: e.target.value })) : setQz(p => ({ ...p, question: e.target.value }))}
              className="input w-full resize-none" rows={3} placeholder="Enter your question..." />
          </div>

          {isFlashcard ? (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Answer *</label>
              <textarea value={fc.answer} onChange={e => setFc(p => ({ ...p, answer: e.target.value }))}
                className="input w-full resize-none" rows={3} placeholder="Enter the answer..." />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Answer Options *</label>
              <div className="space-y-2">
                {qz.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => setQz(p => ({ ...p, correct_answer: opt }))}
                      className={cn('w-7 h-7 rounded-full border-2 flex-shrink-0 text-sm font-bold transition-all',
                        qz.correct_answer === opt && opt ? 'text-white border-transparent' : '')}
                      style={qz.correct_answer === opt && opt ? { background: '#16a34a', borderColor: '#16a34a' } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input value={opt} onChange={e => { const o = [...qz.options]; o[i] = e.target.value; setQz(p => ({ ...p, options: o })) }}
                      className="input flex-1" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                  </div>
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click the letter to mark the correct answer</p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Explanation (optional)</label>
            <textarea value={isFlashcard ? fc.explanation : qz.explanation}
              onChange={e => isFlashcard ? setFc(p => ({ ...p, explanation: e.target.value })) : setQz(p => ({ ...p, explanation: e.target.value }))}
              className="input w-full resize-none" rows={2} placeholder="Add an explanation to help others learn..." />
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <input type="checkbox" id="is-public"
              checked={isFlashcard ? fc.is_public : qz.is_public}
              onChange={e => isFlashcard ? setFc(p => ({ ...p, is_public: e.target.checked })) : setQz(p => ({ ...p, is_public: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <div>
              <label htmlFor="is-public" className="font-medium text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>Share publicly to Library</label>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Will be reviewed before appearing. Earn contribution credits when approved.</p>
            </div>
          </div>

          <button onClick={isFlashcard ? saveFlashcard : saveQuiz} disabled={saving} className="btn btn-accent w-full py-3 font-bold">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save {isFlashcard ? 'Flashcard' : 'Exercise'}</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Create</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Build flashcards and exercises, or use AI (premium)</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 mb-6 w-fit" style={{ background: 'var(--surface-2)' }}>
        <button onClick={() => setTab('create')} className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', tab === 'create' ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
          style={tab === 'create' ? { color: 'var(--text-primary)' } : {}}>
          Build
        </button>
        <button onClick={() => setTab('my-items')} className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', tab === 'my-items' ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
          style={tab === 'my-items' ? { color: 'var(--text-primary)' } : {}}>
          My Library
        </button>
      </div>

      {tab === 'create' ? (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Flashcard */}
          <button onClick={() => setMode('flashcard')} className="card-elevated rounded-2xl p-6 text-left hover:border-amber-400 transition-all" style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(59,130,246,0.1)' }}>
              🃏
            </div>
            <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Flashcard Builder</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create question-answer cards to study key concepts</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: '#e9ae34' }}>
              <Plus size={16} /> Create Flashcard
            </div>
          </button>

          {/* Quiz */}
          <button onClick={() => setMode('quiz')} className="card-elevated rounded-2xl p-6 text-left hover:border-amber-400 transition-all" style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
              📝
            </div>
            <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Exercise Builder</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build multiple-choice practice questions with answers</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: '#e9ae34' }}>
              <Plus size={16} /> Create Exercise
            </div>
          </button>

          {/* AI (Premium - locked) */}
          <div className="card-elevated rounded-2xl p-6 opacity-75 relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="absolute top-3 right-3 badge badge-accent">
              <Lock size={10} /> Premium
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(233,174,52,0.1)' }}>
              ✨
            </div>
            <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>AI Generator</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate exercises from past papers using AI. Coming soon for premium users.</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Sparkles size={16} /> Coming Soon
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* My Flashcards */}
          <div>
            <h2 className="font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>My Flashcards ({myFlashcards.length})</h2>
            {myFlashcards.length === 0 ? (
              <div className="card rounded-2xl p-8 text-center">
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No flashcards yet</p>
                <button onClick={() => { setMode('flashcard'); setTab('create') }} className="btn btn-accent text-sm">Create Your First Flashcard</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {myFlashcards.map(fc => {
                  const s = getSubject(fc.subject)
                  return (
                    <div key={fc.id} className="card rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{s.emoji}</span>
                        <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                        {fc.topic && <span className="badge badge-muted">{fc.topic}</span>}
                        <span className={cn('ml-auto badge', fc.status === 'approved' ? 'badge-success' : fc.status === 'pending' ? 'badge-accent' : 'badge-error')}>
                          {fc.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{fc.question}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fc.answer}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* My Exercises */}
          <div>
            <h2 className="font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>My Exercises ({myExercises.length})</h2>
            {myExercises.length === 0 ? (
              <div className="card rounded-2xl p-8 text-center">
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No exercises yet</p>
                <button onClick={() => { setMode('quiz'); setTab('create') }} className="btn btn-accent text-sm">Create Your First Exercise</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {myExercises.map(ex => {
                  const s = getSubject(ex.subject)
                  return (
                    <div key={ex.id} className="card rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{s.emoji}</span>
                        <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                        <span className={cn('ml-auto badge', ex.status === 'approved' ? 'badge-success' : ex.status === 'pending' ? 'badge-accent' : 'badge-error')}>
                          {ex.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ex.question}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
