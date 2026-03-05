import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react'
import { supabase, type Question, type SubjectType } from '../../lib/supabase'
import { SUBJECTS, getSubject, SUBJECT_TOPICS } from '../../lib/utils'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

type Tab = 'questions' | 'resources' | 'flashcards' | 'exercises'

const emptyQ = {
  question_text: '', subject: '' as SubjectType | '', topic: '',
  difficulty: 1, correct_answer: '', marks: 1,
  options: ['', '', '', ''], explanation: ''
}

export default function AdminContent() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('questions')
  const [questions, setQuestions] = useState<Question[]>([])
  const [pendingFlashcards, setPendingFlashcards] = useState<any[]>([])
  const [pendingExercises, setPendingExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState<Question | null>(null)
  const [form, setForm] = useState({ ...emptyQ })
  const [saving, setSaving] = useState(false)
  const [filterSubject, setFilterSubject] = useState<SubjectType | ''>('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: qs }, { data: fc }, { data: ex }] = await Promise.all([
      supabase.from('questions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('flashcards').select('*, profiles(full_name)').eq('status', 'pending').limit(50),
      supabase.from('exercises').select('*, profiles(full_name)').eq('status', 'pending').limit(50),
    ])
    setQuestions(qs as Question[] || [])
    setPendingFlashcards(fc || [])
    setPendingExercises(ex || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditQ(null)
    setForm({ ...emptyQ })
    setShowForm(true)
  }

  const openEdit = (q: Question) => {
    setEditQ(q)
    setForm({
      question_text: q.question_text, subject: q.subject, topic: q.topic || '',
      difficulty: q.difficulty, correct_answer: q.correct_answer || '', marks: q.marks,
      options: [...q.options, '', '', '', ''].slice(0, 4), explanation: q.explanation || ''
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.question_text.trim() || !form.subject) {
      toast.error('Question text and subject are required'); return
    }
    const opts = form.options.filter(o => o.trim())
    if (opts.length < 2) { toast.error('At least 2 options required'); return }
    if (!opts.includes(form.correct_answer)) { toast.error('Correct answer must match one of the options'); return }

    setSaving(true)
    const payload = {
      question_text: form.question_text, subject: form.subject as SubjectType,
      topic: form.topic || null, difficulty: Number(form.difficulty),
      correct_answer: form.correct_answer, marks: Number(form.marks),
      options: opts, explanation: form.explanation || null
    }

    if (editQ) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editQ.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Question updated!')
    } else {
      const { error } = await supabase.from('questions').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Question added!')
    }
    setShowForm(false)
    fetchAll()
    setSaving(false)
  }

  const deleteQ = async (id: string) => {
    if (!window.confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', id)
    fetchAll(); toast.success('Deleted')
  }

  const approveContent = async (table: string, id: string) => {
    await supabase.from(table).update({ status: 'approved' }).eq('id', id)
    fetchAll(); toast.success('Approved!')
  }

  const rejectContent = async (table: string, id: string) => {
    const reason = window.prompt('Reason for rejection:')
    if (reason === null) return
    await supabase.from(table).update({ status: 'rejected' }).eq('id', id)
    fetchAll()
  }

  const filteredQs = filterSubject ? questions.filter(q => q.subject === filterSubject) : questions
  const topics = form.subject ? SUBJECT_TOPICS[form.subject as SubjectType] || [] : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Content Manager</h1>
        {tab === 'questions' && (
          <button onClick={openNew} className="btn btn-accent ml-auto gap-2 text-sm py-2 px-3">
            <Plus size={14} /> Add Question
          </button>
        )}
      </div>

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-6 w-fit" style={{ background: 'var(--surface-2)' }}>
          {(['questions', 'flashcards', 'exercises'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-white shadow-sm' : '')}
              style={tab === t ? { color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}>
              {t}
              {t === 'flashcards' && pendingFlashcards.length > 0 && (
                <span className="ml-1.5 badge badge-accent text-xs">{pendingFlashcards.length}</span>
              )}
              {t === 'exercises' && pendingExercises.length > 0 && (
                <span className="ml-1.5 badge badge-accent text-xs">{pendingExercises.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="shimmer h-14 rounded-2xl" />)}</div>
        ) : tab === 'questions' ? (
          <>
            <div className="flex gap-3 mb-4">
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value as SubjectType | '')} className="input w-48">
                <option value="">All Subjects</option>
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
              </select>
              <span className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {filteredQs.length} question{filteredQs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="card rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Question</th>
                    <th className="text-center p-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Subject</th>
                    <th className="text-center p-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Topic</th>
                    <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Marks</th>
                    <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQs.map(q => {
                    const s = getSubject(q.subject)
                    return (
                      <tr key={q.id} className="border-t hover:bg-[var(--surface-2)] transition-colors"
                        style={{ borderColor: 'var(--border)' }}>
                        <td className="p-3 max-w-xs">
                          <p className="text-sm truncate font-medium" style={{ color: 'var(--text-primary)' }}>{q.question_text}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                            ✓ {q.correct_answer}
                          </p>
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell">
                          <span className="text-base">{s.emoji}</span>
                        </td>
                        <td className="p-3 text-center hidden md:table-cell">
                          {q.topic ? (
                            <span className="badge badge-muted">{q.topic}</span>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>{q.marks}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
                              style={{ color: 'var(--text-muted)' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteQ(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredQs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No questions yet. Add your first question above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          // Pending content approval
          <div className="space-y-3">
            <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              Pending {tab === 'flashcards' ? 'Flashcards' : 'Exercises'} — Student Submissions
            </h2>
            {(tab === 'flashcards' ? pendingFlashcards : pendingExercises).length === 0 ? (
              <div className="card rounded-2xl p-12 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending submissions</p>
              </div>
            ) : (tab === 'flashcards' ? pendingFlashcards : pendingExercises).map((item: any) => {
              const s = getSubject(item.subject)
              const table = tab === 'flashcards' ? 'flashcards' : 'exercises'
              return (
                <div key={item.id} className="card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {item.profiles?.full_name || 'Student'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label} · {item.topic}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveContent(table, item.id)} className="btn btn-primary text-xs py-1.5 px-3">Approve</button>
                      <button onClick={() => rejectContent(table, item.id)} className="btn btn-outline text-xs py-1.5 px-3 text-red-500">Reject</button>
                    </div>
                  </div>
                  <div className="space-y-2 ml-8">
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--surface-2)' }}>
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Q: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.question}</span>
                    </div>
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(22,163,74,0.08)' }}>
                      <span className="font-medium text-green-600">A: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.answer}</span>
                    </div>
                    {item.explanation && (
                      <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(59,130,246,0.06)' }}>
                        <span className="font-medium" style={{ color: '#3b82f6' }}>Explanation: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
            style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {editQ ? 'Edit Question' : 'Add Question'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <textarea
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                className="input w-full resize-none" rows={3}
                placeholder="Question text..." />

              <div className="grid grid-cols-2 gap-3">
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value as SubjectType, topic: '' }))}
                  className="input">
                  <option value="">Subject</option>
                  {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                </select>
                <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  className="input">
                  <option value="">Topic (optional)</option>
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Marks</label>
                  <input type="number" min={1} max={10} value={form.marks}
                    onChange={e => setForm(f => ({ ...f, marks: Number(e.target.value) }))}
                    className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Difficulty (1-5)</label>
                  <input type="number" min={1} max={5} value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                    className="input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Answer Options (mark the correct one below)
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input value={opt}
                        onChange={e => setForm(f => {
                          const opts = [...f.options]; opts[i] = e.target.value; return { ...f, options: opts }
                        })}
                        className="input flex-1 text-sm" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                      <input type="radio" name="correct" checked={form.correct_answer === opt && opt !== ''}
                        onChange={() => opt && setForm(f => ({ ...f, correct_answer: opt }))}
                        className="w-4 h-4 flex-shrink-0 accent-green-500" title="Mark as correct" />
                    </div>
                  ))}
                </div>
                {form.correct_answer && (
                  <p className="text-xs mt-1.5 text-green-600">✓ Correct answer: {form.correct_answer}</p>
                )}
              </div>

              <textarea
                value={form.explanation}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                className="input w-full resize-none text-sm" rows={2}
                placeholder="Explanation (shown after answering)..." />

              <button onClick={save} disabled={saving} className="btn btn-accent w-full py-3 font-bold">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Question</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
