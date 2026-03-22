import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, ChevronDown, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SUBJECTS } from '../../lib/utils'
import { toast } from 'sonner'

type QuestionType = 'mcq' | 'short_answer' | 'essay' | 'practical'
type PaperNumber = 'paper_1' | 'paper_2' | 'paper_3'
type Section = 'section_a' | 'section_b' | 'section_c'

interface Question {
  id: string
  paper_id: string | null
  question_text: string
  subject: string
  topic: string
  question_type: QuestionType
  paper_number: PaperNumber | null
  section: Section | null
  question_number: string
  sub_question: string
  marks: number
  year: number | null
  difficulty: number
  correct_answer: string
  marking_guide: string
  options: string[]
  explanation: string
  has_diagram: boolean
  diagram_description: string
  created_at: string
}

const EMPTY_QUESTION: Omit<Question, 'id' | 'created_at'> = {
  paper_id: null,
  question_text: '',
  subject: 'chemistry',
  topic: '',
  question_type: 'short_answer',
  paper_number: 'paper_1',
  section: 'section_a',
  question_number: '',
  sub_question: '',
  marks: 2,
  year: new Date().getFullYear(),
  difficulty: 2,
  correct_answer: '',
  marking_guide: '',
  options: ['', '', '', ''],
  explanation: '',
  has_diagram: false,
  diagram_description: '',
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'MCQ (Multiple Choice)',
  short_answer: 'Short Answer',
  essay: 'Restricted Essay',
  practical: 'Practical / Experiment',
}

const SECTION_LABELS: Record<Section, string> = {
  section_a: 'Section A — Short Answer',
  section_b: 'Section B — Essay',
  section_c: 'Section C',
}

const PAPER_LABELS: Record<PaperNumber, string> = {
  paper_1: 'Paper 1 — Theory',
  paper_2: 'Paper 2 — Practical',
  paper_3: 'Paper 3',
}

export default function AdminContent() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_QUESTION })
  const [saving, setSaving] = useState(false)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: q }, { data: p }] = await Promise.all([
      supabase.from('questions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('papers').select('id, title, subject, year').order('year', { ascending: false })
    ])
    setQuestions((q || []) as Question[])
    setPapers(p || [])
    setLoading(false)
  }

  function startNew() {
    setForm({ ...EMPTY_QUESTION })
    setEditingId(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEdit(q: Question) {
    setForm({
      paper_id: q.paper_id,
      question_text: q.question_text,
      subject: q.subject,
      topic: q.topic || '',
      question_type: q.question_type || 'short_answer',
      paper_number: q.paper_number || 'paper_1',
      section: q.section || 'section_a',
      question_number: q.question_number || '',
      sub_question: q.sub_question || '',
      marks: q.marks || 2,
      year: q.year || null,
      difficulty: q.difficulty || 2,
      correct_answer: q.correct_answer || '',
      marking_guide: q.marking_guide || '',
      options: q.options?.length ? q.options : ['', '', '', ''],
      explanation: q.explanation || '',
      has_diagram: q.has_diagram || false,
      diagram_description: q.diagram_description || '',
    })
    setEditingId(q.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
  }

  async function saveQuestion() {
    if (!form.question_text.trim()) { toast.error('Question text is required'); return }
    if (!form.subject) { toast.error('Subject is required'); return }
    if (form.marks < 1) { toast.error('Marks must be at least 1'); return }

    setSaving(true)
    const payload = {
      ...form,
      options: form.question_type === 'mcq' ? form.options.filter(o => o.trim()) : [],
      correct_answer: form.question_type === 'mcq' ? form.correct_answer : null,
      marking_guide: form.question_type !== 'mcq' ? form.marking_guide : null,
    }

    const { error } = editingId
      ? await supabase.from('questions').update(payload).eq('id', editingId)
      : await supabase.from('questions').insert(payload)

    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success(editingId ? 'Question updated' : 'Question added')
      cancelForm()
      fetchData()
    }
    setSaving(false)
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', id)
    toast.success('Deleted')
    fetchData()
  }

  const filtered = questions.filter(q => {
    if (filterSubject && q.subject !== filterSubject) return false
    if (filterType && q.question_type !== filterType) return false
    return true
  })

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Question Bank</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{questions.length} questions total</p>
        </div>
        <button onClick={startNew}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#e9ae34', color: '#1f3d5d' }}>
          <Plus size={15} /> Add Question
        </button>
      </div>

      <div className="p-4 max-w-3xl mx-auto">

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card rounded-2xl p-5 mb-6 border-2" style={{ borderColor: '#e9ae34' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {editingId ? 'Edit Question' : 'New Question'}
              </h2>
              <button onClick={cancelForm} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div className="grid gap-4">

              {/* Row 1: Subject + Question Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Subject</label>
                  <select className="input" value={form.subject} onChange={e => set('subject', e.target.value)}>
                    {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Question Type</label>
                  <select className="input" value={form.question_type} onChange={e => set('question_type', e.target.value as QuestionType)}>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Paper + Section + Year */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Paper</label>
                  <select className="input" value={form.paper_number || ''} onChange={e => set('paper_number', e.target.value || null)}>
                    <option value="">— None —</option>
                    {Object.entries(PAPER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Section</label>
                  <select className="input" value={form.section || ''} onChange={e => set('section', e.target.value || null)}>
                    <option value="">— None —</option>
                    {Object.entries(SECTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input" value={form.year || ''} min={2010} max={2030}
                    onChange={e => set('year', e.target.value ? parseInt(e.target.value) : null)} placeholder="2023" />
                </div>
              </div>

              {/* Row 3: Q number + Sub Q + Marks + Difficulty */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="label">Q Number</label>
                  <input className="input" value={form.question_number} onChange={e => set('question_number', e.target.value)} placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="label">Sub-Q</label>
                  <input className="input" value={form.sub_question} onChange={e => set('sub_question', e.target.value)} placeholder="e.g. a, i" />
                </div>
                <div>
                  <label className="label">Marks</label>
                  <input type="number" className="input" value={form.marks} min={1} max={20}
                    onChange={e => set('marks', parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="label">Difficulty (1–5)</label>
                  <input type="number" className="input" value={form.difficulty} min={1} max={5}
                    onChange={e => set('difficulty', parseInt(e.target.value) || 1)} />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="label">Topic</label>
                <input className="input" value={form.topic} onChange={e => set('topic', e.target.value)}
                  placeholder="e.g. Electrolysis, Allotropy, Hazard Symbols" />
              </div>

              {/* Link to paper */}
              <div>
                <label className="label">Link to Paper (optional)</label>
                <select className="input" value={form.paper_id || ''} onChange={e => set('paper_id', e.target.value || null)}>
                  <option value="">— Not linked —</option>
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>{p.year} — {p.subject} — {p.title}</option>
                  ))}
                </select>
              </div>

              {/* Question text */}
              <div>
                <label className="label">Question Text</label>
                <textarea className="input min-h-[100px]" value={form.question_text}
                  onChange={e => set('question_text', e.target.value)}
                  placeholder="Type the full question exactly as it appears on the paper..." />
              </div>

              {/* Diagram flag */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="has_diagram" checked={form.has_diagram}
                  onChange={e => set('has_diagram', e.target.checked)}
                  className="w-4 h-4 rounded" />
                <label htmlFor="has_diagram" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  This question references a diagram or figure
                </label>
              </div>
              {form.has_diagram && (
                <div>
                  <label className="label">Describe the diagram</label>
                  <textarea className="input" value={form.diagram_description}
                    onChange={e => set('diagram_description', e.target.value)}
                    placeholder="e.g. Figure 1 shows the hazard symbol — a black X on white background in a square border" />
                </div>
              )}

              {/* MCQ options */}
              {form.question_type === 'mcq' && (
                <div>
                  <label className="label">Answer Options (A, B, C, D)</label>
                  <div className="grid gap-2">
                    {['A', 'B', 'C', 'D'].map((letter, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm font-bold w-5" style={{ color: 'var(--text-muted)' }}>{letter}</span>
                        <input className="input flex-1" value={form.options[i] || ''}
                          onChange={e => {
                            const opts = [...form.options]
                            opts[i] = e.target.value
                            set('options', opts)
                          }} placeholder={`Option ${letter}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="label">Correct Answer</label>
                    <select className="input" value={form.correct_answer} onChange={e => set('correct_answer', e.target.value)}>
                      <option value="">Select correct option</option>
                      {['A', 'B', 'C', 'D'].map((l, i) => (
                        <option key={l} value={form.options[i]}>{l}: {form.options[i]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Marking guide for non-MCQ */}
              {form.question_type !== 'mcq' && (
                <div>
                  <label className="label">Marking Guide / Model Answer</label>
                  <textarea className="input min-h-[100px]" value={form.marking_guide}
                    onChange={e => set('marking_guide', e.target.value)}
                    placeholder="List the marking points — e.g. &#10;• X symbol means harmful/irritant (1 mark)&#10;• Wear gloves (1 mark)&#10;• Work in ventilated area (1 mark)" />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="label">Explanation (shown after attempt)</label>
                <textarea className="input" value={form.explanation}
                  onChange={e => set('explanation', e.target.value)}
                  placeholder="Optional: explain the concept behind this question for students" />
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <button onClick={cancelForm}
                  className="px-5 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button onClick={saveQuestion} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                  <Save size={15} /> {saving ? 'Saving...' : editingId ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select className="input flex-1 text-sm" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <select className="input flex-1 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Question list */}
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading questions...</div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center">
            <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No questions yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Start adding real MSCE questions from past papers
            </p>
            <button onClick={startNew}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#e9ae34', color: '#1f3d5d' }}>
              Add First Question
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(q => {
              const subject = SUBJECTS.find(s => s.value === q.subject)
              return (
                <div key={q.id} className="card rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Meta badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                          {subject?.emoji} {subject?.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#e9ae3420', color: '#b8861f' }}>
                          {QUESTION_TYPE_LABELS[q.question_type] || q.question_type}
                        </span>
                        {q.year && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                            {q.year}
                          </span>
                        )}
                        {q.paper_number && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                            {PAPER_LABELS[q.paper_number]}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#16a34a20', color: '#16a34a' }}>
                          {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                        </span>
                        {q.has_diagram && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#3b82f620', color: '#3b82f6' }}>
                            📊 Has diagram
                          </span>
                        )}
                      </div>

                      {/* Question number + text */}
                      <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {q.question_number && <span style={{ color: '#e9ae34' }}>Q{q.question_number}{q.sub_question ? `(${q.sub_question})` : ''}: </span>}
                        {q.question_text}
                      </p>

                      {/* Topic */}
                      {q.topic && (
                        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Topic: {q.topic}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => startEdit(q)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteQuestion(q.id)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: '#dc262610', color: '#dc2626' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
