import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, Layers, ClipboardList, FileText, Star, CheckCircle, Upload, Plus, X, Link, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUBJECTS } from '../lib/utils'
import { awardXP } from '../lib/useXP'
import { toast } from 'sonner'
import type { SubjectType } from '../lib/supabase'

type LibTab = 'papers' | 'flashcards' | 'quizzes' | 'materials'

const TABS = [
  { key: 'papers'     as LibTab, label: 'Past Papers', icon: <FileText size={15} />    },
  { key: 'flashcards' as LibTab, label: 'Flashcards',  icon: <Layers size={15} />      },
  { key: 'quizzes'    as LibTab, label: 'Quizzes',     icon: <ClipboardList size={15} /> },
  { key: 'materials'  as LibTab, label: 'Materials',   icon: <BookOpen size={15} />    },
]

const ACCEPTED = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg','.jpeg'], 'image/png': ['.png'] }

// ─── Drag-drop zone ───────────────────────────────────────────────────────────
function DropZone({ onFile, file, label = 'Drop PDF or image here' }: {
  onFile: (f: File) => void
  file: File | null
  label?: string
}) {
  const [over, setOver] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const validate = (f: File) => {
    const ok = f.type === 'application/pdf' || f.type === 'image/jpeg' || f.type === 'image/png'
    if (!ok) { toast.error('Only PDFs and images (JPG/PNG) allowed'); return }
    if (f.size > 20 * 1024 * 1024) { toast.error('File too large — max 20MB'); return }
    onFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) validate(f)
  }, [])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
      className="cursor-pointer rounded-2xl border-2 border-dashed transition-all p-6 text-center"
      style={{ borderColor: over ? '#e9ae34' : 'var(--border)', background: over ? 'rgba(233,174,52,0.06)' : 'var(--surface-2)' }}>
      <input ref={ref} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => { const f = e.target.files?.[0]; if (f) validate(f) }} />
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle size={18} style={{ color: '#16a34a' }} />
          <span className="text-sm font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
        </div>
      ) : (
        <>
          <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, JPG or PNG · max 20MB</p>
        </>
      )}
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ tab, onClose, onSuccess }: { tab: LibTab; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [driveUrl, setDriveUrl] = useState('')
  const [useLink, setUseLink] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<SubjectType>('mathematics')
  const [year, setYear] = useState(new Date().getFullYear())
  const [paperType, setPaperType] = useState<'msce_official' | 'school_paper'>('msce_official')
  const [matType, setMatType] = useState('notes')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!user) return
    if (!title.trim()) { toast.error('Title is required'); return }
    if (tab === 'papers' && !file && !driveUrl.trim()) { toast.error('Upload a file or paste a Drive link'); return }
    if ((tab === 'materials') && !file) { toast.error('Please attach a file'); return }

    setSaving(true)
    try {
      let fileUrl = driveUrl.trim() || null

      // Upload file to Supabase Storage if provided
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { data: storageData, error: storageError } = await supabase.storage
          .from('library-uploads')
          .upload(path, file, { contentType: file.type })
        if (storageError) throw storageError
        const { data: urlData } = supabase.storage.from('library-uploads').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      if (tab === 'papers') {
        await supabase.from('paper_uploads').insert({
          user_id: user.id, title: title.trim(), subject, year,
          paper_type: paperType, file_url: fileUrl!, status: 'pending'
        })
      } else if (tab === 'materials') {
        await supabase.from('library_materials').insert({
          title: title.trim(), subject, material_type: matType,
          file_url: fileUrl!, description: desc.trim(),
          is_published: false, created_by: user.id
        })
      }

      await awardXP(user.id, 'upload_paper', subject)
      toast.success('Submitted for review! You\'ll earn XP once approved.')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'))
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              {tab === 'papers' ? 'Upload Past Paper' : tab === 'materials' ? 'Share Material' : 'Share Content'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Reviewed before appearing publicly</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <div className="p-5 grid gap-4">
          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={tab === 'papers' ? 'e.g. Chemistry Paper 1 — 2023' : 'e.g. Biology Summary Notes — Form 4'} />
          </div>

          {/* Subject */}
          <div>
            <label className="label">Subject</label>
            <select className="input" value={subject} onChange={e => setSubject(e.target.value as SubjectType)}>
              {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
            </select>
          </div>

          {/* Paper-specific fields */}
          {tab === 'papers' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input" value={year} min={2010} max={2030}
                    onChange={e => setYear(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={paperType} onChange={e => setPaperType(e.target.value as any)}>
                    <option value="msce_official">MANEB Official</option>
                    <option value="school_paper">School Paper</option>
                  </select>
                </div>
              </div>

              {/* Upload method toggle */}
              <div className="flex gap-2">
                <button onClick={() => setUseLink(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={!useLink ? { background: '#1f3d5d', color: 'white' } : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  📎 Upload File
                </button>
                <button onClick={() => setUseLink(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={useLink ? { background: '#1f3d5d', color: 'white' } : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  🔗 Drive Link
                </button>
              </div>

              {useLink ? (
                <div>
                  <label className="label">Google Drive Link</label>
                  <input className="input" value={driveUrl} onChange={e => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..." />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Make sure the file is set to "Anyone with the link can view"
                  </p>
                </div>
              ) : (
                <DropZone file={file} onFile={setFile} label="Drop the past paper here (PDF or image)" />
              )}
            </>
          )}

          {/* Materials-specific fields */}
          {tab === 'materials' && (
            <>
              <div>
                <label className="label">Material Type</label>
                <select className="input" value={matType} onChange={e => setMatType(e.target.value)}>
                  <option value="notes">Notes</option>
                  <option value="summary">Summary</option>
                  <option value="textbook">Textbook Excerpt</option>
                  <option value="pamphlet">Pamphlet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input min-h-[70px]" value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Brief description of what this material covers..." />
              </div>
              <DropZone file={file} onFile={setFile} label="Drop your material here (PDF or image)" />
            </>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(233,174,52,0.08)', border: '1px solid rgba(233,174,52,0.2)' }}>
            <AlertCircle size={14} style={{ color: '#e9ae34', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              All uploads are reviewed before appearing publicly. You earn XP when your submission is approved.
            </p>
          </div>

          <button onClick={submit} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold"
            style={{ background: '#e9ae34', color: '#1f3d5d' }}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <>Submit for Review</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Library ─────────────────────────────────────────────────────────────
export default function Library() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState<LibTab>('papers')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [papers, setPapers] = useState<any[]>([])
  const [flashcardDecks, setFlashcardDecks] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null)
  const [uploadModal, setUploadModal] = useState<LibTab | null>(null)

  useEffect(() => { fetchAll() }, [user])

  async function fetchAll() {
    setLoading(true)
    try {
      const [{ data: p }, { data: fd }, { data: q }, { data: m }] = await Promise.all([
        supabase.from('papers').select('*').eq('is_published', true).order('year', { ascending: false }),
        supabase.from('flashcard_decks').select('*').eq('is_public', true).order('created_at', { ascending: false }),
        supabase.from('community_quizzes').select('*').eq('is_public', true).order('created_at', { ascending: false }),
        supabase.from('library_materials').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      ])
      setPapers(p || [])
      setFlashcardDecks(fd || [])
      setQuizzes(q || [])
      setMaterials(m || [])

      if (user) {
        const { data: prog } = await supabase.from('user_paper_progress').select('*').eq('user_id', user.id)
        const progMap: Record<string, any> = {}
        const favSet = new Set<string>()
        ;(prog || []).forEach((r: any) => {
          progMap[r.paper_id] = r
          if (r.is_favorite) favSet.add(r.paper_id)
        })
        setProgress(progMap)
        setFavorites(favSet)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load library')
    }
    setLoading(false)
  }

  async function toggleFavorite(paperId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) return
    const isFav = favorites.has(paperId)
    const newFavs = new Set(favorites)
    isFav ? newFavs.delete(paperId) : newFavs.add(paperId)
    setFavorites(newFavs)
    await supabase.from('user_paper_progress').upsert(
      { user_id: user.id, paper_id: paperId, is_favorite: !isFav },
      { onConflict: 'user_id,paper_id' }
    )
  }

  async function toggleComplete(paperId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) return
    const isDone = !progress[paperId]?.is_completed
    setProgress(p => ({ ...p, [paperId]: { ...p[paperId], is_completed: isDone } }))
    await supabase.from('user_paper_progress').upsert(
      { user_id: user.id, paper_id: paperId, is_completed: isDone, completed_at: isDone ? new Date().toISOString() : null },
      { onConflict: 'user_id,paper_id' }
    )
    toast.success(isDone ? 'Marked as complete ✓' : 'Marked incomplete')
  }

  const filterItems = (items: any[]) => items.filter(item => {
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase())) return false
    if (subjectFilter && item.subject !== subjectFilter) return false
    return true
  })

  const subOf = (s: string) => SUBJECTS.find(x => x.value === s)

  const UploadBtn = ({ label }: { label: string }) => (
    <button onClick={() => setUploadModal(tab)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
      style={{ background: '#e9ae34', color: '#1f3d5d' }}>
      <Upload size={13} /> {label}
    </button>
  )

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Library</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Past papers, flashcards, quizzes & study materials</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={tab === t.key ? { background: '#1f3d5d', color: 'white' } : { color: 'var(--text-muted)' }}>
              {t.icon}<span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div className="px-4 mb-4 flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm" placeholder="Search..." />
        </div>
        <select className="input text-sm w-32" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="">All</option>
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
        </select>
      </div>

      <div className="px-4">

        {/* ── PAST PAPERS ── */}
        {tab === 'papers' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{papers.length} papers</p>
              <UploadBtn label="Upload Paper" />
            </div>
            {loading ? <Skeletons /> : filterItems(papers).length === 0 ? (
              <Empty icon="📄" title="No papers yet" sub="Be the first to upload a past paper"
                action={{ label: 'Upload Paper', onClick: () => setUploadModal('papers') }} />
            ) : (
              <div className="grid gap-3">
                {filterItems(papers).map(paper => {
                  const sub = subOf(paper.subject)
                  const prog = progress[paper.id]
                  const isExpanded = expandedPaper === paper.id
                  const isFav = favorites.has(paper.id)
                  const isDone = prog?.is_completed
                  return (
                    <div key={paper.id}>
                      <button onClick={() => setExpandedPaper(isExpanded ? null : paper.id)}
                        className="w-full card rounded-2xl p-4 text-left"
                        style={{ border: `2px solid ${isExpanded ? '#e9ae34' : 'transparent'}` }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: 'var(--surface-2)' }}>{sub?.emoji || '📄'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{paper.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {sub?.label} · {paper.year} · {paper.paper_type === 'msce_official' ? 'MANEB' : 'School Paper'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={e => toggleFavorite(paper.id, e)} className="p-1.5 rounded-lg"
                                  style={{ color: isFav ? '#e9ae34' : 'var(--text-muted)' }}>
                                  <Star size={14} fill={isFav ? '#e9ae34' : 'none'} />
                                </button>
                                {isDone && <CheckCircle size={15} style={{ color: '#16a34a' }} />}
                              </div>
                            </div>
                            {paper.topics?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {paper.topics.slice(0, 3).map((t: string) => (
                                  <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="card rounded-2xl p-4 mt-1 border-l-4 animate-fade-in"
                          style={{ borderLeftColor: '#e9ae34' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>YOUR NOTES</p>
                          <textarea defaultValue={prog?.notes || ''}
                            onBlur={async e => {
                              if (!user) return
                              await supabase.from('user_paper_progress').upsert(
                                { user_id: user.id, paper_id: paper.id, notes: e.target.value },
                                { onConflict: 'user_id,paper_id' }
                              )
                              toast.success('Note saved')
                            }}
                            className="input text-sm mb-4 min-h-[60px]" placeholder="Add a note..." />
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: isDone ? '100%' : '0%', background: '#16a34a' }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: isDone ? '#16a34a' : 'var(--text-muted)' }}>
                              {isDone ? '✓ Complete' : 'Not started'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={e => toggleComplete(paper.id, e)}
                              className="flex-1 py-3 rounded-xl text-sm font-semibold"
                              style={isDone
                                ? { background: '#16a34a20', color: '#16a34a', border: '1.5px solid #16a34a40' }
                                : { background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                              {isDone ? '✓ Mark Incomplete' : 'Mark Complete'}
                            </button>
                            <button onClick={() => navigate(`/papers/${paper.id}`)}
                              className="flex-1 py-3 rounded-xl text-sm font-bold"
                              style={{ background: '#1f3d5d', color: 'white' }}>
                              View Paper →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── FLASHCARD DECKS ── */}
        {tab === 'flashcards' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{flashcardDecks.length} shared decks</p>
              <UploadBtn label="Build Deck" />
            </div>
            {filterItems(flashcardDecks).length === 0 ? (
              <Empty icon="🃏" title="No decks yet" sub="Build a deck in Create and share it here"
                action={{ label: 'Build a Deck', onClick: () => navigate('/create?tab=flashcards') }} />
            ) : (
              <div className="grid gap-3">
                {filterItems(flashcardDecks).map(deck => (
                  <button key={deck.id} onClick={() => navigate(`/flashcards/${deck.id}`)}
                    className="card rounded-2xl p-4 text-left w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'var(--surface-2)' }}>{subOf(deck.subject)?.emoji || '🃏'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{deck.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {subOf(deck.subject)?.label} · {deck.card_count || 0} cards
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: '#e9ae3420', color: '#b8861f' }}>Study →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── QUIZZES ── */}
        {tab === 'quizzes' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{quizzes.length} shared quizzes</p>
              <UploadBtn label="Build Quiz" />
            </div>
            {filterItems(quizzes).length === 0 ? (
              <Empty icon="📝" title="No quizzes yet" sub="Build a quiz in Create and share it"
                action={{ label: 'Build a Quiz', onClick: () => navigate('/create?tab=quizzes') }} />
            ) : (
              <div className="grid gap-3">
                {filterItems(quizzes).map(quiz => (
                  <button key={quiz.id} onClick={() => navigate(`/take-test?quiz=${quiz.id}`)}
                    className="card rounded-2xl p-4 text-left w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'var(--surface-2)' }}>{subOf(quiz.subject)?.emoji || '📝'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{quiz.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {subOf(quiz.subject)?.label} · {quiz.question_count || 0} questions
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: '#1f3d5d20', color: '#1f3d5d' }}>Take →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MATERIALS ── */}
        {tab === 'materials' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{materials.length} materials</p>
              <UploadBtn label="Share Material" />
            </div>

            {/* Publisher contact */}
            <div className="card rounded-2xl p-4 mb-4 flex items-start gap-3"
              style={{ border: '1.5px solid var(--border)' }}>
              <span className="text-xl flex-shrink-0">📬</span>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Publishers & Authors</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Want to list your book or resource here? Contact us to discuss placement and commission.
                </p>
                <a href="mailto:wngplays@gmail.com?subject=Publisher Inquiry — MSCE Prep"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: '#1f3d5d', color: 'white' }}>
                  Contact Us
                </a>
              </div>
            </div>

            {filterItems(materials).length === 0 ? (
              <Empty icon="📚" title="No materials yet" sub="Share notes, summaries or textbook excerpts for other students" />
            ) : (
              <div className="grid gap-3">
                {filterItems(materials).map(mat => (
                  <a key={mat.id} href={mat.file_url} target="_blank" rel="noopener noreferrer"
                    className="card rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'var(--surface-2)' }}>
                      {mat.file_url?.endsWith('.pdf') ? '📄' : subOf(mat.subject)?.emoji || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{mat.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {subOf(mat.subject)?.label} · {mat.material_type}
                        {mat.description && ` · ${mat.description.slice(0, 40)}...`}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: '#e9ae34' }}>Open →</span>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload modal */}
      {uploadModal && (
        <UploadModal
          tab={uploadModal}
          onClose={() => setUploadModal(null)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  )
}

function Skeletons() {
  return (
    <div className="grid gap-3">
      {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)}
    </div>
  )
}

function Empty({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="card rounded-2xl p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      {action && (
        <button onClick={action.onClick} className="px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#e9ae34', color: '#1f3d5d' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
