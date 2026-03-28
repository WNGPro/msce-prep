import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Save, Loader2, Globe, Lock, ChevronRight, Sparkles, Upload, X, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUBJECTS } from '../lib/utils'
import { awardXP } from '../lib/useXP'
import { toast } from 'sonner'
import type { SubjectType } from '../lib/supabase'

type CreateTab = 'flashcards' | 'quizzes' | 'exercises'

// ─── Drag-drop image/pdf attachment ──────────────────────────────────────────
function DiagramAttachment({ file, onFile, onRemove }: {
  file: File | null
  onFile: (f: File) => void
  onRemove: () => void
}) {
  const [over, setOver] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const validate = (f: File) => {
    if (!['image/jpeg','image/png','application/pdf'].includes(f.type)) {
      toast.error('Only JPG, PNG or PDF allowed'); return
    }
    if (f.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return }
    onFile(f)
  }

  if (file) {
    const isImg = file.type.startsWith('image/')
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl"
        style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
        {isImg ? (
          <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'var(--surface)' }}>📄</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button onClick={onRemove} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><X size={13} /></button>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) validate(f) }}
      onClick={() => ref.current?.click()}
      className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all"
      style={{
        border: `1.5px dashed ${over ? '#e9ae34' : 'var(--border)'}`,
        background: over ? 'rgba(233,174,52,0.06)' : 'transparent'
      }}>
      <input ref={ref} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
        onChange={e => { const f = e.target.files?.[0]; if (f) validate(f) }} />
      <Upload size={14} style={{ color: 'var(--text-muted)' }} />
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Attach diagram (JPG, PNG or PDF)</span>
    </div>
  )
}

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadDiagram(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `diagrams/${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('library-uploads').upload(path, file, { contentType: file.type })
  if (error) { toast.error('Diagram upload failed'); return null }
  const { data } = supabase.storage.from('library-uploads').getPublicUrl(path)
  return data.publicUrl
}

// ─── Visibility toggle ────────────────────────────────────────────────────────
function VisibilityToggle({ isPublic, onChange }: { isPublic: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!isPublic)}
      className="flex items-center gap-3 p-3 rounded-xl w-full transition-all"
      style={{
        background: isPublic ? '#e9ae3412' : 'var(--surface-2)',
        border: `1.5px solid ${isPublic ? '#e9ae34' : 'var(--border)'}`
      }}>
      {isPublic ? <Globe size={16} style={{ color: '#e9ae34' }} /> : <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
      <div className="text-left">
        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          {isPublic ? 'Share with Library' : 'Keep Private'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isPublic ? 'Reviewed before appearing publicly · earns XP' : 'Only visible to you'}
        </p>
      </div>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Create() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<CreateTab>((searchParams.get('tab') as CreateTab) || 'flashcards')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Create</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build flashcards, quizzes and exercises from your MSCE notes</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-5">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
          {([
            { key: 'flashcards', icon: '🃏', label: 'Flashcards' },
            { key: 'quizzes',    icon: '📝', label: 'Quizzes'    },
            { key: 'exercises',  icon: '✏️', label: 'Exercises'  },
          ] as { key: CreateTab; icon: string; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={tab === t.key ? { background: '#1f3d5d', color: 'white' } : { color: 'var(--text-muted)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI teaser */}
      <div className="mx-4 mb-5 p-3.5 rounded-2xl"
        style={{ background: 'rgba(233,174,52,0.06)', border: '1.5px dashed rgba(233,174,52,0.35)' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <Sparkles size={13} style={{ color: '#e9ae34' }} />
          <span className="text-xs font-bold" style={{ color: '#e9ae34' }}>AI Generation — Coming Soon</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Once MSCE Prep has enough verified paper context, AI will generate content automatically. For now, build manually below.
        </p>
      </div>

      <div className="px-4">
        {tab === 'flashcards' && <FlashcardBuilder />}
        {tab === 'quizzes'    && <QuizBuilder />}
        {tab === 'exercises'  && <ExerciseBuilder />}
      </div>
    </div>
  )
}

// ─── FLASHCARD BUILDER ────────────────────────────────────────────────────────
function FlashcardBuilder() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<SubjectType>(profile?.subjects?.[0] || 'mathematics')
  const [topic, setTopic] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [cards, setCards] = useState([{ front: '', back: '', diagram: null as File | null }])
  const [saving, setSaving] = useState(false)
  const [myDecks, setMyDecks] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('flashcard_decks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setMyDecks(data || []))
  }, [user])

  const addCard = () => setCards(c => [...c, { front: '', back: '', diagram: null }])
  const removeCard = (i: number) => setCards(c => c.filter((_, idx) => idx !== i))
  const updateCard = (i: number, field: string, val: any) =>
    setCards(c => c.map((card, idx) => idx === i ? { ...card, [field]: val } : card))

  async function save() {
    if (!user) return
    if (!title.trim()) { toast.error('Give your deck a title'); return }
    const valid = cards.filter(c => c.front.trim() && c.back.trim())
    if (valid.length < 2) { toast.error('Add at least 2 complete cards'); return }
    setSaving(true)
    const { data: deck, error } = await supabase.from('flashcard_decks').insert({
      user_id: user.id, title: title.trim(), subject, topic: topic.trim(),
      is_public: false, pending_approval: isPublic, card_count: valid.length,
    }).select().single()
    if (error || !deck) { toast.error('Failed to save'); setSaving(false); return }

    for (let i = 0; i < valid.length; i++) {
      const card = valid[i]
      let diagramUrl: string | null = null
      if (card.diagram) diagramUrl = await uploadDiagram(card.diagram, user.id)
      await supabase.from('flashcards').insert({
        deck_id: deck.id, user_id: user.id,
        front: card.front, back: card.back,
        order_index: i, image_url: diagramUrl,
      })
    }
    if (isPublic) await awardXP(user.id, 'build_flashcard_deck', subject)
    toast.success(isPublic ? 'Deck submitted for review! ✓' : 'Deck saved privately ✓')
    setTitle(''); setTopic(''); setCards([{ front: '', back: '', diagram: null }]); setIsPublic(false)
    supabase.from('flashcard_decks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setMyDecks(data || []))
    setSaving(false)
  }

  return (
    <div className="grid gap-5">
      <div className="card rounded-2xl p-4 grid gap-3">
        <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>Deck Details</p>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Chemistry — Electrolysis Revision" />
        <div className="grid grid-cols-2 gap-3">
          <select className="input text-sm" value={subject} onChange={e => setSubject(e.target.value as SubjectType)}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <input className="input text-sm" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" />
        </div>
        <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            Cards ({cards.filter(c => c.front && c.back).length} complete)
          </p>
          <button onClick={addCard} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
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
                <button onClick={() => removeCard(i)} style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
              )}
            </div>
            <div className="grid gap-2">
              <div>
                <label className="label">Front (Question)</label>
                <textarea className="input text-sm min-h-[70px]" value={card.front}
                  onChange={e => updateCard(i, 'front', e.target.value)}
                  placeholder="e.g. What is allotropy?" />
              </div>
              <div>
                <label className="label">Back (Answer)</label>
                <textarea className="input text-sm min-h-[70px]" value={card.back}
                  onChange={e => updateCard(i, 'back', e.target.value)}
                  placeholder="e.g. The existence of an element in two or more physical forms in the same state" />
              </div>
              <DiagramAttachment
                file={card.diagram}
                onFile={f => updateCard(i, 'diagram', f)}
                onRemove={() => updateCard(i, 'diagram', null)}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base"
        style={{ background: '#e9ae34', color: '#1f3d5d' }}>
        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Deck</>}
      </button>

      {myDecks.length > 0 && (
        <div>
          <p className="font-bold font-display text-sm mb-3" style={{ color: 'var(--text-primary)' }}>My Decks</p>
          <div className="grid gap-2">
            {myDecks.map(deck => (
              <button key={deck.id} onClick={() => navigate(`/flashcards/${deck.id}`)}
                className="card rounded-xl p-3 flex items-center gap-3 text-left w-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{deck.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {deck.card_count} cards · {deck.pending_approval ? '⏳ Pending' : deck.is_public ? '🌐 Public' : '🔒 Private'}
                  </p>
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
function QuizBuilder() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<SubjectType>(profile?.subjects?.[0] || 'mathematics')
  const [topic, setTopic] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [questions, setQuestions] = useState([{ question: '', answer: '', marks: 1, diagram: null as File | null }])
  const [saving, setSaving] = useState(false)
  const [myQuizzes, setMyQuizzes] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('community_quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setMyQuizzes(data || []))
  }, [user])

  const addQ = () => setQuestions(q => [...q, { question: '', answer: '', marks: 1, diagram: null }])
  const removeQ = (i: number) => setQuestions(q => q.filter((_, idx) => idx !== i))
  const updateQ = (i: number, field: string, val: any) =>
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  async function save() {
    if (!user) return
    if (!title.trim()) { toast.error('Give your quiz a title'); return }
    const valid = questions.filter(q => q.question.trim() && q.answer.trim())
    if (valid.length < 2) { toast.error('Add at least 2 complete questions'); return }
    setSaving(true)
    const { data: quiz, error } = await supabase.from('community_quizzes').insert({
      user_id: user.id, title: title.trim(), subject, topic: topic.trim(),
      is_public: false, pending_approval: isPublic,
      question_count: valid.length, total_marks: valid.reduce((s, q) => s + q.marks, 0),
    }).select().single()
    if (error || !quiz) { toast.error('Failed to save'); setSaving(false); return }

    for (let i = 0; i < valid.length; i++) {
      const q = valid[i]
      let diagramUrl: string | null = null
      if (q.diagram) diagramUrl = await uploadDiagram(q.diagram, user.id)
      await supabase.from('community_quiz_questions').insert({
        quiz_id: quiz.id, question_text: q.question, correct_answer: q.answer,
        marks: q.marks, order_index: i, diagram_url: diagramUrl,
      })
    }
    if (isPublic) await awardXP(user.id, 'build_quiz', subject)
    toast.success(isPublic ? 'Quiz submitted for review! ✓' : 'Quiz saved privately ✓')
    setTitle(''); setTopic(''); setQuestions([{ question: '', answer: '', marks: 1, diagram: null }]); setIsPublic(false)
    supabase.from('community_quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setMyQuizzes(data || []))
    setSaving(false)
  }

  return (
    <div className="grid gap-5">
      <div className="card rounded-2xl p-4 grid gap-3">
        <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>Quiz Details</p>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Chemistry Paper 1 — Section A Practice" />
        <div className="grid grid-cols-2 gap-3">
          <select className="input text-sm" value={subject} onChange={e => setSubject(e.target.value as SubjectType)}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <input className="input text-sm" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" />
        </div>
        <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            Questions ({questions.filter(q => q.question && q.answer).length} complete)
          </p>
          <button onClick={addQ} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
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
              <textarea className="input text-sm min-h-[80px]" value={q.question}
                onChange={e => updateQ(i, 'question', e.target.value)}
                placeholder="Type the question exactly as it might appear in an MSCE paper..." />
              <textarea className="input text-sm min-h-[60px]" value={q.answer}
                onChange={e => updateQ(i, 'answer', e.target.value)}
                placeholder="Model answer / marking points..." />
              <DiagramAttachment
                file={q.diagram}
                onFile={f => updateQ(i, 'diagram', f)}
                onRemove={() => updateQ(i, 'diagram', null)}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base"
        style={{ background: '#e9ae34', color: '#1f3d5d' }}>
        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Quiz</>}
      </button>

      {myQuizzes.length > 0 && (
        <div>
          <p className="font-bold font-display text-sm mb-3" style={{ color: 'var(--text-primary)' }}>My Quizzes</p>
          <div className="grid gap-2">
            {myQuizzes.map(quiz => (
              <button key={quiz.id} onClick={() => navigate(`/take-test?quiz=${quiz.id}`)}
                className="card rounded-xl p-3 flex items-center gap-3 text-left w-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{quiz.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {quiz.question_count} questions · {quiz.pending_approval ? '⏳ Pending' : quiz.is_public ? '🌐 Public' : '🔒 Private'}
                  </p>
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

// ─── EXERCISE BUILDER ─────────────────────────────────────────────────────────
function ExerciseBuilder() {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<SubjectType>(profile?.subjects?.[0] || 'mathematics')
  const [topic, setTopic] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [items, setItems] = useState([{ question: '', answer: '', explanation: '', marks: 1, diagram: null as File | null }])
  const [saving, setSaving] = useState(false)
  const [myExercises, setMyExercises] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('exercises').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setMyExercises(data || []))
  }, [user])

  const addItem = () => setItems(i => [...i, { question: '', answer: '', explanation: '', marks: 1, diagram: null }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, val: any) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  async function save() {
    if (!user) return
    if (!title.trim()) { toast.error('Give your exercise set a title'); return }
    const valid = items.filter(it => it.question.trim() && it.answer.trim())
    if (valid.length < 1) { toast.error('Add at least 1 complete question'); return }
    setSaving(true)

    for (const item of valid) {
      let diagramUrl: string | null = null
      if (item.diagram) diagramUrl = await uploadDiagram(item.diagram, user.id)
      await supabase.from('exercises').insert({
        user_id: user.id,
        subject, topic: topic.trim(),
        question: item.question,
        answer: item.answer,
        explanation: item.explanation,
        image_url: diagramUrl,
        is_public: false,
        status: isPublic ? 'pending' : 'approved',
      })
    }
    if (isPublic) await awardXP(user.id, 'build_flashcard_deck', subject)
    toast.success(isPublic ? 'Exercise set submitted for review! ✓' : 'Exercise set saved privately ✓')
    setTitle(''); setTopic(''); setItems([{ question: '', answer: '', explanation: '', marks: 1, diagram: null }]); setIsPublic(false)
    supabase.from('exercises').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setMyExercises(data || []))
    setSaving(false)
  }

  return (
    <div className="grid gap-5">
      <div className="card rounded-2xl p-4 grid gap-3">
        <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>Exercise Set Details</p>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Biology — Cell Division Practice Set" />
        <div className="grid grid-cols-2 gap-3">
          <select className="input text-sm" value={subject} onChange={e => setSubject(e.target.value as SubjectType)}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <input className="input text-sm" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" />
        </div>
        <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            Questions ({items.filter(it => it.question && it.answer).length} complete)
          </p>
          <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#1f3d5d', color: 'white' }}>
            <Plus size={13} /> Add Question
          </button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#10b98120', color: '#10b981' }}>Q{i + 1}</span>
                <div className="flex items-center gap-1">
                  <input type="number" min={1} max={20} value={item.marks}
                    onChange={e => updateItem(i, 'marks', parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs py-1 rounded-lg border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>marks</span>
                </div>
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
              )}
            </div>
            <div className="grid gap-2">
              <textarea className="input text-sm min-h-[80px]" value={item.question}
                onChange={e => updateItem(i, 'question', e.target.value)}
                placeholder="Question text..." />
              <textarea className="input text-sm min-h-[60px]" value={item.answer}
                onChange={e => updateItem(i, 'answer', e.target.value)}
                placeholder="Model answer..." />
              <textarea className="input text-sm" value={item.explanation}
                onChange={e => updateItem(i, 'explanation', e.target.value)}
                placeholder="Explanation (optional — shown after student attempts)" />
              <DiagramAttachment
                file={item.diagram}
                onFile={f => updateItem(i, 'diagram', f)}
                onRemove={() => updateItem(i, 'diagram', null)}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base"
        style={{ background: '#e9ae34', color: '#1f3d5d' }}>
        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Exercise Set</>}
      </button>

      {myExercises.length > 0 && (
        <div>
          <p className="font-bold font-display text-sm mb-3" style={{ color: 'var(--text-primary)' }}>My Exercises</p>
          <div className="grid gap-2">
            {myExercises.map(ex => (
              <div key={ex.id} className="card rounded-xl p-3">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ex.question}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {ex.subject} · {ex.status === 'pending' ? '⏳ Pending review' : '🔒 Private'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
