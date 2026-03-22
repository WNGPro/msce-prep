import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Save, Loader2, Globe, Lock, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUBJECTS, cn } from '../lib/utils'
import { toast } from 'sonner'

type CreateTab = 'flashcards' | 'quizzes'

export default function Create() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<CreateTab>((searchParams.get('tab') as CreateTab) || 'flashcards')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Create</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build flashcards and quizzes from your MSCE study material</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
          <button onClick={() => setTab('flashcards')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'flashcards' ? { background: '#1f3d5d', color: 'white' } : { color: 'var(--text-muted)' }}>
            🃏 Flashcard Deck
          </button>
          <button onClick={() => setTab('quizzes')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'quizzes' ? { background: '#1f3d5d', color: 'white' } : { color: 'var(--text-muted)' }}>
            📝 Quiz
          </button>
        </div>
      </div>

      {/* AI teaser banner */}
      <div className="mx-4 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(233,174,52,0.08)', border: '1.5px dashed rgba(233,174,52,0.4)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} style={{ color: '#e9ae34' }} />
          <span className="text-xs font-bold" style={{ color: '#e9ae34' }}>AI Generation — Coming Soon</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Once the app has enough real MSCE context, AI will generate flashcards and quizzes directly from past papers. For now, build them manually below.
        </p>
      </div>

      <div className="px-4">
        {tab === 'flashcards' ? <FlashcardBuilder user={user} profile={profile} navigate={navigate} /> : <QuizBuilder user={user} profile={profile} navigate={navigate} />}
      </div>
    </div>
  )
}

// ─── FLASHCARD BUILDER ────────────────────────────────────────────────────────

function FlashcardBuilder({ user, profile, navigate }: any) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(profile?.subjects?.[0] || 'chemistry')
  const [topic, setTopic] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [cards, setCards] = useState([{ front: '', back: '' }])
  const [saving, setSaving] = useState(false)
  const [myDecks, setMyDecks] = useState<any[]>([])
  const [loadedDecks, setLoadedDecks] = useState(false)

  async function loadMyDecks() {
    if (!user || loadedDecks) return
    const { data } = await supabase.from('flashcard_decks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMyDecks(data || [])
    setLoadedDecks(true)
  }

  React.useEffect(() => { loadMyDecks() }, [user])

  const addCard = () => setCards(c => [...c, { front: '', back: '' }])
  const removeCard = (i: number) => setCards(c => c.filter((_, idx) => idx !== i))
  const updateCard = (i: number, field: 'front' | 'back', val: string) => {
    setCards(c => c.map((card, idx) => idx === i ? { ...card, [field]: val } : card))
  }

  async function saveDeck() {
    if (!user) { toast.error('Sign in to save'); return }
    if (!title.trim()) { toast.error('Give your deck a title'); return }
    const validCards = cards.filter(c => c.front.trim() && c.back.trim())
    if (validCards.length < 2) { toast.error('Add at least 2 complete cards'); return }

    setSaving(true)
    const { data: deck, error } = await supabase.from('flashcard_decks').insert({
      user_id: user.id,
      title: title.trim(),
      subject,
      topic: topic.trim(),
      is_public: false, // always private first — admin approves for public
      pending_approval: isPublic, // flag: user wants it public
      card_count: validCards.length,
    }).select().single()

    if (error || !deck) { toast.error('Failed to save deck'); setSaving(false); return }

    // Save cards
    await supabase.from('flashcards').insert(
      validCards.map((c, i) => ({
        deck_id: deck.id,
        user_id: user.id,
        front: c.front,
        back: c.back,
        order_index: i,
      }))
    )

    toast.success(isPublic ? 'Deck saved! Submitted for approval to appear in Library.' : 'Deck saved privately ✓')
    setTitle(''); setTopic(''); setCards([{ front: '', back: '' }]); setIsPublic(false)
    loadMyDecks()
    setSaving(false)
  }

  return (
    <div className="grid gap-5">
      {/* Deck info */}
      <div className="card rounded-2xl p-4 grid gap-3">
        <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>Deck Details</p>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Deck title e.g. Chemistry — Electrolysis Revision" />
        <div className="grid grid-cols-2 gap-3">
          <select className="input text-sm" value={subject} onChange={e => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <input className="input text-sm" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" />
        </div>
        {/* Public toggle */}
        <button onClick={() => setIsPublic(p => !p)}
          className="flex items-center gap-3 p-3 rounded-xl transition-all"
          style={{ background: isPublic ? '#e9ae3415' : 'var(--surface-2)', border: `1.5px solid ${isPublic ? '#e9ae34' : 'var(--border)'}` }}>
          {isPublic ? <Globe size={16} style={{ color: '#e9ae34' }} /> : <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
          <div className="text-left">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isPublic ? 'Share with Library' : 'Keep Private'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isPublic ? 'Will be reviewed before appearing publicly' : 'Only visible to you'}
            </p>
          </div>
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            Cards ({cards.filter(c => c.front && c.back).length} complete)
          </p>
          <button onClick={addCard} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#1f3d5d', color: 'white' }}>
            <Plus size={13} /> Add Card
          </button>
        </div>

        {cards.map((card, i) => (
          <div key={i} className="card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#e9ae3420', color: '#b8861f' }}>Card {i + 1}</span>
              {cards.length > 1 && (
                <button onClick={() => removeCard(i)} style={{ color: '#dc2626' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="grid gap-2">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>FRONT (Question)</label>
                <textarea className="input text-sm min-h-[70px]" value={card.front}
                  onChange={e => updateCard(i, 'front', e.target.value)}
                  placeholder="e.g. What is allotropy?" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>BACK (Answer)</label>
                <textarea className="input text-sm min-h-[70px]" value={card.back}
                  onChange={e => updateCard(i, 'back', e.target.value)}
                  placeholder="e.g. The existence of an element in two or more physical forms in the same state" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <button onClick={saveDeck} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold"
        style={{ background: '#e9ae34', color: '#1f3d5d' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Deck'}
      </button>

      {/* My decks */}
      {myDecks.length > 0 && (
        <div>
          <p className="font-bold font-display text-sm mb-3" style={{ color: 'var(--text-primary)' }}>My Decks</p>
          <div className="grid gap-2">
            {myDecks.map(deck => (
              <button key={deck.id} onClick={() => navigate(`/flashcards/${deck.id}`)}
                className="card rounded-xl p-3 flex items-center gap-3 text-left w-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{deck.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{deck.card_count} cards · {deck.pending_approval ? '⏳ Pending approval' : deck.is_public ? '🌐 Public' : '🔒 Private'}</p>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── QUIZ BUILDER ─────────────────────────────────────────────────────────────

function QuizBuilder({ user, profile, navigate }: any) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(profile?.subjects?.[0] || 'chemistry')
  const [topic, setTopic] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [questions, setQuestions] = useState([{ question: '', answer: '', marks: 1 }])
  const [saving, setSaving] = useState(false)
  const [myQuizzes, setMyQuizzes] = useState<any[]>([])
  const [loadedQuizzes, setLoadedQuizzes] = useState(false)

  async function loadMyQuizzes() {
    if (!user || loadedQuizzes) return
    const { data } = await supabase.from('community_quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMyQuizzes(data || [])
    setLoadedQuizzes(true)
  }

  React.useEffect(() => { loadMyQuizzes() }, [user])

  const addQ = () => setQuestions(q => [...q, { question: '', answer: '', marks: 1 }])
  const removeQ = (i: number) => setQuestions(q => q.filter((_, idx) => idx !== i))
  const updateQ = (i: number, field: string, val: any) => {
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  async function saveQuiz() {
    if (!user) { toast.error('Sign in to save'); return }
    if (!title.trim()) { toast.error('Give your quiz a title'); return }
    const validQs = questions.filter(q => q.question.trim() && q.answer.trim())
    if (validQs.length < 2) { toast.error('Add at least 2 complete questions'); return }

    setSaving(true)
    const { data: quiz, error } = await supabase.from('community_quizzes').insert({
      user_id: user.id,
      title: title.trim(),
      subject,
      topic: topic.trim(),
      is_public: false,
      pending_approval: isPublic,
      question_count: validQs.length,
      total_marks: validQs.reduce((sum, q) => sum + q.marks, 0),
    }).select().single()

    if (error || !quiz) { toast.error('Failed to save quiz'); setSaving(false); return }

    await supabase.from('community_quiz_questions').insert(
      validQs.map((q, i) => ({
        quiz_id: quiz.id,
        question_text: q.question,
        correct_answer: q.answer,
        marks: q.marks,
        order_index: i,
      }))
    )

    toast.success(isPublic ? 'Quiz saved! Submitted for approval.' : 'Quiz saved privately ✓')
    setTitle(''); setTopic(''); setQuestions([{ question: '', answer: '', marks: 1 }]); setIsPublic(false)
    loadMyQuizzes()
    setSaving(false)
  }

  return (
    <div className="grid gap-5">
      {/* Quiz info */}
      <div className="card rounded-2xl p-4 grid gap-3">
        <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>Quiz Details</p>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title e.g. Chemistry Paper 1 — Section A Practice" />
        <div className="grid grid-cols-2 gap-3">
          <select className="input text-sm" value={subject} onChange={e => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <input className="input text-sm" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" />
        </div>
        <button onClick={() => setIsPublic(p => !p)}
          className="flex items-center gap-3 p-3 rounded-xl transition-all"
          style={{ background: isPublic ? '#e9ae3415' : 'var(--surface-2)', border: `1.5px solid ${isPublic ? '#e9ae34' : 'var(--border)'}` }}>
          {isPublic ? <Globe size={16} style={{ color: '#e9ae34' }} /> : <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
          <div className="text-left">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{isPublic ? 'Share with Library' : 'Keep Private'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isPublic ? 'Reviewed before appearing publicly' : 'Only visible to you'}</p>
          </div>
        </button>
      </div>

      {/* Questions */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            Questions ({questions.filter(q => q.question && q.answer).length} complete)
          </p>
          <button onClick={addQ} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#1f3d5d', color: 'white' }}>
            <Plus size={13} /> Add Question
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#1f3d5d20', color: '#1f3d5d' }}>Q{i + 1}</span>
                <div className="flex items-center gap-1">
                  <input type="number" min={1} max={20} value={q.marks}
                    onChange={e => updateQ(i, 'marks', parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs py-1 rounded-lg border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>marks</span>
                </div>
              </div>
              {questions.length > 1 && (
                <button onClick={() => removeQ(i)} style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
              )}
            </div>
            <div className="grid gap-2">
              <textarea className="input text-sm min-h-[70px]" value={q.question}
                onChange={e => updateQ(i, 'question', e.target.value)}
                placeholder="Type the question exactly as it might appear in an MSCE paper..." />
              <textarea className="input text-sm min-h-[60px]" value={q.answer}
                onChange={e => updateQ(i, 'answer', e.target.value)}
                placeholder="Model answer / marking points..." />
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <button onClick={saveQuiz} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold"
        style={{ background: '#e9ae34', color: '#1f3d5d' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Quiz'}
      </button>

      {/* My quizzes */}
      {myQuizzes.length > 0 && (
        <div>
          <p className="font-bold font-display text-sm mb-3" style={{ color: 'var(--text-primary)' }}>My Quizzes</p>
          <div className="grid gap-2">
            {myQuizzes.map(quiz => (
              <button key={quiz.id} onClick={() => navigate(`/take-test?quiz=${quiz.id}`)}
                className="card rounded-xl p-3 flex items-center gap-3 text-left w-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{quiz.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{quiz.question_count} questions · {quiz.pending_approval ? '⏳ Pending' : quiz.is_public ? '🌐 Public' : '🔒 Private'}</p>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
