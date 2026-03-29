import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Eye, FileText, Layers, ClipboardList, BookOpen, Clock, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SUBJECTS } from '../../lib/utils'
import { toast } from 'sonner'

type QueueTab = 'papers' | 'flashcards' | 'quizzes' | 'materials'

const TABS = [
  { key: 'papers'     as QueueTab, label: 'Papers',     icon: <FileText size={14} />,      color: '#3b82f6' },
  { key: 'flashcards' as QueueTab, label: 'Flashcards',  icon: <Layers size={14} />,        color: '#8b5cf6' },
  { key: 'quizzes'    as QueueTab, label: 'Quizzes',     icon: <ClipboardList size={14} />, color: '#10b981' },
  { key: 'materials'  as QueueTab, label: 'Materials',   icon: <BookOpen size={14} />,      color: '#f59e0b' },
]

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminUploads() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<QueueTab>('papers')
  const [papers, setPapers] = useState<any[]>([])
  const [decks, setDecks] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: QueueTab } | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: p }, { data: d }, { data: q }, { data: m }] = await Promise.all([
      supabase.from('paper_uploads').select('*, profiles(full_name, school_name)').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('flashcard_decks').select('*, profiles(full_name, school_name)').eq('pending_approval', true).eq('is_public', false).order('created_at', { ascending: false }),
      supabase.from('community_quizzes').select('*, profiles(full_name, school_name)').eq('pending_approval', true).eq('is_public', false).order('created_at', { ascending: false }),
      supabase.from('library_materials').select('*').eq('is_published', false).order('created_at', { ascending: false }),
    ])
    setPapers(p || [])
    setDecks(d || [])
    setQuizzes(q || [])
    setMaterials(m || [])
    setLoading(false)
  }

  const counts = { papers: papers.length, flashcards: decks.length, quizzes: quizzes.length, materials: materials.length }
  const totalPending = Object.values(counts).reduce((a, b) => a + b, 0)

  async function approvePaper(id: string) {
    setProcessing(id)
    await supabase.from('paper_uploads').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
    toast.success('Paper approved ✓')
    await fetchAll()
    setProcessing(null)
  }

  async function rejectPaper(id: string, reason: string) {
    setProcessing(id)
    await supabase.from('paper_uploads').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', id)
    toast.success('Paper rejected')
    await fetchAll()
    setProcessing(null)
  }

  async function approveDeck(id: string) {
    setProcessing(id)
    await supabase.from('flashcard_decks').update({ is_public: true, pending_approval: false }).eq('id', id)
    toast.success('Deck approved — now public ✓')
    await fetchAll()
    setProcessing(null)
  }

  async function rejectDeck(id: string, reason: string) {
    setProcessing(id)
    await supabase.from('flashcard_decks').update({ pending_approval: false }).eq('id', id)
    toast.success('Deck rejected')
    await fetchAll()
    setProcessing(null)
  }

  async function approveQuiz(id: string) {
    setProcessing(id)
    await supabase.from('community_quizzes').update({ is_public: true, pending_approval: false }).eq('id', id)
    toast.success('Quiz approved — now public ✓')
    await fetchAll()
    setProcessing(null)
  }

  async function rejectQuiz(id: string, reason: string) {
    setProcessing(id)
    await supabase.from('community_quizzes').update({ pending_approval: false }).eq('id', id)
    toast.success('Quiz rejected')
    await fetchAll()
    setProcessing(null)
  }

  async function approveMaterial(id: string) {
    setProcessing(id)
    await supabase.from('library_materials').update({ is_published: true }).eq('id', id)
    toast.success('Material published ✓')
    await fetchAll()
    setProcessing(null)
  }

  async function rejectMaterial(id: string) {
    setProcessing(id)
    await supabase.from('library_materials').delete().eq('id', id)
    toast.success('Material deleted')
    await fetchAll()
    setProcessing(null)
  }

  function startReject(id: string, type: QueueTab) {
    setRejectTarget({ id, type })
    setRejectReason('')
  }

  async function confirmReject() {
    if (!rejectTarget) return
    const { id, type } = rejectTarget
    if (type === 'papers') await rejectPaper(id, rejectReason)
    if (type === 'flashcards') await rejectDeck(id, rejectReason)
    if (type === 'quizzes') await rejectQuiz(id, rejectReason)
    if (type === 'materials') await rejectMaterial(id)
    setRejectTarget(null)
  }

  const sub = (s: string) => SUBJECTS.find(x => x.value === s)

  const ActionBtns = ({ id, type, onApprove }: { id: string; type: QueueTab; onApprove: () => void }) => (
    <div className="flex gap-2 mt-3">
      <button onClick={onApprove} disabled={!!processing}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
        style={{ background: '#16a34a', color: 'white', opacity: processing === id ? 0.6 : 1 }}>
        <CheckCircle size={14} /> Approve
      </button>
      <button onClick={() => startReject(id, type)} disabled={!!processing}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: '#dc262615', color: '#dc2626', border: '1.5px solid #dc262630' }}>
        <XCircle size={14} /> Reject
      </button>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Upload Review Queue</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalPending > 0 ? `${totalPending} pending review` : 'All clear ✓'}
          </p>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">

        {/* Tabs with counts */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
              style={{
                background: tab === t.key ? `${t.color}15` : 'var(--surface)',
                border: `1.5px solid ${tab === t.key ? t.color : 'var(--border)'}`,
              }}>
              <span style={{ color: tab === t.key ? t.color : 'var(--text-muted)' }}>{t.icon}</span>
              <span className="text-xs font-semibold" style={{ color: tab === t.key ? t.color : 'var(--text-muted)' }}>
                {t.label}
              </span>
              {counts[t.key] > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: t.color, color: 'white', fontSize: '0.65rem' }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)}
          </div>
        ) : (

          <>
            {/* PAPERS */}
            {tab === 'papers' && (
              papers.length === 0 ? <Empty label="No pending paper uploads" /> : (
                <div className="grid gap-3">
                  {papers.map(p => (
                    <div key={p.id} className="card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {sub(p.subject)?.emoji} {sub(p.subject)?.label} · {p.year} · {p.paper_type === 'msce_official' ? 'MANEB' : 'School Paper'}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            by {p.profiles?.full_name || 'Unknown'} · {p.profiles?.school_name || ''} · {timeAgo(p.created_at)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                          <Clock size={10} className="inline mr-1" />pending
                        </span>
                      </div>
                      {p.file_url && (
                        <a href={p.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium mb-1"
                          style={{ color: '#3b82f6' }}>
                          <Eye size={12} /> View file
                        </a>
                      )}
                      <ActionBtns id={p.id} type="papers" onApprove={() => approvePaper(p.id)} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* FLASHCARD DECKS */}
            {tab === 'flashcards' && (
              decks.length === 0 ? <Empty label="No pending flashcard decks" /> : (
                <div className="grid gap-3">
                  {decks.map(d => (
                    <div key={d.id} className="card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{d.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {sub(d.subject)?.emoji} {sub(d.subject)?.label} {d.topic ? `· ${d.topic}` : ''} · {d.card_count} cards
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            by {d.profiles?.full_name || 'Unknown'} · {timeAgo(d.created_at)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#f59e0b20', color: '#f59e0b' }}>pending</span>
                      </div>
                      <ActionBtns id={d.id} type="flashcards" onApprove={() => approveDeck(d.id)} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* QUIZZES */}
            {tab === 'quizzes' && (
              quizzes.length === 0 ? <Empty label="No pending quizzes" /> : (
                <div className="grid gap-3">
                  {quizzes.map(q => (
                    <div key={q.id} className="card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{q.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {sub(q.subject)?.emoji} {sub(q.subject)?.label} · {q.question_count} questions · {q.total_marks} marks
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            by {q.profiles?.full_name || 'Unknown'} · {timeAgo(q.created_at)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#f59e0b20', color: '#f59e0b' }}>pending</span>
                      </div>
                      <ActionBtns id={q.id} type="quizzes" onApprove={() => approveQuiz(q.id)} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* MATERIALS */}
            {tab === 'materials' && (
              materials.length === 0 ? <Empty label="No pending materials" /> : (
                <div className="grid gap-3">
                  {materials.map(m => (
                    <div key={m.id} className="card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {sub(m.subject)?.emoji} {sub(m.subject)?.label} · {m.material_type}
                          </p>
                          {m.description && <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>{m.description}</p>}
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(m.created_at)}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#f59e0b20', color: '#f59e0b' }}>pending</span>
                      </div>
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium mb-1"
                          style={{ color: '#3b82f6' }}>
                          <Eye size={12} /> View file
                        </a>
                      )}
                      <ActionBtns id={m.id} type="materials" onApprove={() => approveMaterial(m.id)} />
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Reject submission</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Optionally give a reason — the student will see this.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input text-sm min-h-[80px] mb-4"
              placeholder="e.g. This paper is already in the library / content doesn't meet quality standards..." />
            <div className="flex gap-2">
              <button onClick={() => setRejectTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={confirmReject}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: '#dc2626', color: 'white' }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="card rounded-2xl p-12 text-center">
      <div className="text-4xl mb-3">✅</div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>All clear</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}
