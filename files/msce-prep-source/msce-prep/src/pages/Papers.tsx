import React, { useState, useEffect } from 'react'
import { Search, Upload, Filter, Download, Star, CheckCircle, Share2, Eye, ChevronRight, X, BookOpen, Wifi, WifiOff, StickyNote } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Paper, type SubjectType } from '../lib/supabase'
import { SUBJECTS, getSubject, formatDate, cn } from '../lib/utils'
import { savePaperOffline, isPaperSavedOffline, removePaperOffline } from '../lib/offline'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import UploadPaperModal from '../components/papers/UploadPaperModal'

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017]

interface PaperWithMeta extends Paper {
  isComplete?: boolean
  isFavorite?: boolean
  offlineSaved?: boolean
  notes?: string
}

export default function Papers() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [papers, setPapers] = useState<PaperWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'browse' | 'uploads'>('browse')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<SubjectType | ''>('')
  const [yearFilter, setYearFilter] = useState<number | ''>('')
  const [typeFilter, setTypeFilter] = useState<'' | 'msce_official' | 'school_paper'>('')
  const [selectedPaper, setSelectedPaper] = useState<PaperWithMeta | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  useEffect(() => { fetchPapers() }, [subjectFilter, yearFilter, typeFilter, activeTab])

  async function fetchPapers() {
    if (!profile) return
    setLoading(true)
    let q = supabase.from('papers').select('*').eq('is_published', true)
    if (subjectFilter) q = q.eq('subject', subjectFilter)
    if (yearFilter) q = q.eq('year', yearFilter)
    if (typeFilter) q = q.eq('paper_type', typeFilter)

    if (activeTab === 'uploads') {
      const { data: uploads } = await supabase.from('paper_uploads').select('*').eq('user_id', profile.user_id)
      setLoading(false)
      // Map uploads to paper format for display
      const mapped = (uploads || []).map(u => ({
        id: u.id, title: u.title, subject: u.subject as SubjectType,
        year: u.year, paper_type: u.paper_type as any, file_url: u.file_url,
        description: null, topics: [], is_published: u.status === 'approved',
        created_at: u.created_at, status: u.status
      }))
      setPapers(mapped)
      return
    }

    const { data } = await q.order('year', { ascending: false })
    if (data) {
      // Fetch user progress for these papers
      const ids = data.map(p => p.id)
      const { data: progress } = await supabase
        .from('user_paper_progress').select('*')
        .eq('user_id', profile.user_id).in('paper_id', ids)
      const progMap: Record<string, any> = {}
      progress?.forEach(p => { progMap[p.paper_id] = p })

      const withMeta = await Promise.all(data.map(async p => ({
        ...p,
        isComplete: progMap[p.id]?.is_completed || false,
        isFavorite: progMap[p.id]?.is_favorite || false,
        notes: progMap[p.id]?.notes || '',
        offlineSaved: await isPaperSavedOffline(p.id)
      })))
      setPapers(withMeta)
    }
    setLoading(false)
  }

  const filtered = papers.filter(p =>
    search === '' || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.subject.includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  async function toggleComplete(paper: PaperWithMeta) {
    if (!profile) return
    const next = !paper.isComplete
    await supabase.from('user_paper_progress').upsert({
      user_id: profile.user_id, paper_id: paper.id, is_completed: next,
      completed_at: next ? new Date().toISOString() : null
    }, { onConflict: 'user_id,paper_id' })
    setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isComplete: next } : p))
    if (selectedPaper?.id === paper.id) setSelectedPaper(sp => sp ? { ...sp, isComplete: next } : sp)
    toast.success(next ? 'Marked as complete!' : 'Marked as incomplete')
  }

  async function toggleFavorite(paper: PaperWithMeta) {
    if (!profile) return
    const next = !paper.isFavorite
    await supabase.from('user_paper_progress').upsert({
      user_id: profile.user_id, paper_id: paper.id, is_favorite: next
    }, { onConflict: 'user_id,paper_id' })
    setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isFavorite: next } : p))
    if (selectedPaper?.id === paper.id) setSelectedPaper(sp => sp ? { ...sp, isFavorite: next } : sp)
  }

  async function toggleOffline(paper: PaperWithMeta) {
    if (paper.offlineSaved) {
      await removePaperOffline(paper.id)
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, offlineSaved: false } : p))
      toast.success('Removed from offline storage')
    } else {
      await savePaperOffline(paper as any)
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, offlineSaved: true } : p))
      toast.success('Saved for offline access!')
    }
  }

  function sharePaper(paper: PaperWithMeta) {
    const url = `${window.location.origin}/papers/${paper.id}`
    if (navigator.share) {
      navigator.share({ title: paper.title, text: `Study ${paper.title} on MSCE Prep`, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  const subj = selectedPaper ? getSubject(selectedPaper.subject) : null

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Library</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Past papers, flashcards, and study materials</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn btn-accent gap-2">
          <Upload size={16} /> Upload Paper
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 mb-6 w-fit" style={{ background: 'var(--surface-2)' }}>
        <button onClick={() => setActiveTab('browse')} className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'browse' ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
          style={activeTab === 'browse' ? { color: 'var(--text-primary)' } : {}}>
          Browse Papers
        </button>
        <button onClick={() => setActiveTab('uploads')} className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'uploads' ? 'bg-white shadow-sm dark:bg-navy-700' : 'text-[var(--text-muted)]')}
          style={activeTab === 'uploads' ? { color: 'var(--text-primary)' } : {}}>
          My Uploads
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 w-full" placeholder="Search papers or topics..." />
        </div>
        <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value as any); setPage(1) }} className="input w-auto">
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
        </select>
        <select value={yearFilter} onChange={e => { setYearFilter(e.target.value ? Number(e.target.value) : ''); setPage(1) }} className="input w-auto">
          <option value="">All Years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as any); setPage(1) }} className="input w-auto">
          <option value="">All Types</option>
          <option value="msce_official">MSCE Official</option>
          <option value="school_paper">School Paper</option>
        </select>
      </div>

      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Showing {filtered.length} paper{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-48 rounded-2xl" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold font-display text-lg mb-1" style={{ color: 'var(--text-primary)' }}>No papers found</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'uploads' ? "You haven't uploaded any papers yet." : 'Try adjusting your filters.'}
          </p>
          {activeTab === 'uploads' && (
            <button onClick={() => setShowUpload(true)} className="btn btn-accent mt-4">Upload a Paper</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(paper => {
            const s = getSubject(paper.subject)
            return (
              <div key={paper.id} className="paper-card rounded-2xl overflow-hidden" onClick={() => setSelectedPaper(paper)}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${s.color}20` }}>
                      {s.emoji}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: s.color }}>{s.label}</div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{paper.year}</span>
                        <span className="badge badge-muted">{paper.paper_type === 'msce_official' ? 'MSCE' : 'School'}</span>
                      </div>
                    </div>
                    {paper.isFavorite && <Star size={14} className="ml-auto text-amber-500 fill-current" />}
                    {paper.isComplete && <CheckCircle size={14} className="text-green-500" style={{ marginLeft: paper.isFavorite ? '0' : 'auto' }} />}
                  </div>
                  <h3 className="font-bold text-sm font-display mb-2" style={{ color: 'var(--text-primary)' }}>{paper.title}</h3>
                  {paper.topics?.slice(0, 3).map(t => (
                    <span key={t} className="badge badge-muted mr-1 mb-1">{t}</span>
                  ))}
                </div>
                <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={e => { e.stopPropagation(); toggleOffline(paper) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: paper.offlineSaved ? '#16a34a' : 'var(--text-muted)' }}>
                    {paper.offlineSaved ? <WifiOff size={14} /> : <Download size={14} />}
                    {paper.offlineSaved ? 'Saved' : 'Save Offline'}
                  </button>
                  <div className="w-px" style={{ background: 'var(--border)' }} />
                  <button onClick={e => { e.stopPropagation(); navigate(`/papers/${paper.id}`) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: '#e9ae34' }}>
                    View Paper <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline px-4 py-2 text-sm">Previous</button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline px-4 py-2 text-sm">Next</button>
        </div>
      )}

      {/* Expanded Paper Card */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slide-up" style={{ background: 'var(--surface)' }}>
            {/* Banner */}
            <div className="h-3" style={{ background: `linear-gradient(90deg, ${subj?.color || '#1f3d5d'}, ${subj?.color || '#1f3d5d'}80)` }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${subj?.color || '#1f3d5d'}20` }}>
                    {subj?.emoji}
                  </div>
                  <div>
                    <div className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>{selectedPaper.title}</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{subj?.label} · {selectedPaper.year}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedPaper(null)} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'var(--surface-2)' }}>
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Progress</div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: selectedPaper.isComplete ? '100%' : '0%' }} />
                  </div>
                </div>
                {selectedPaper.isComplete && <CheckCircle size={20} className="text-green-500" />}
              </div>

              {/* Notes */}
              <textarea
                className="input w-full text-sm resize-none mb-4"
                rows={2}
                placeholder="Add notes about this paper..."
                defaultValue={selectedPaper.notes}
                onBlur={async e => {
                  if (!profile) return
                  await supabase.from('user_paper_progress').upsert({
                    user_id: profile.user_id, paper_id: selectedPaper.id, notes: e.target.value
                  }, { onConflict: 'user_id,paper_id' })
                }}
              />

              {/* Actions grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => toggleComplete(selectedPaper)} className={cn('btn py-3 text-sm gap-2', selectedPaper.isComplete ? 'btn-outline' : 'btn-primary')}>
                  <CheckCircle size={15} />
                  {selectedPaper.isComplete ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button onClick={() => toggleFavorite(selectedPaper)} className={cn('btn py-3 text-sm gap-2', selectedPaper.isFavorite ? 'btn-accent' : 'btn-outline')}>
                  <Star size={15} className={selectedPaper.isFavorite ? 'fill-current' : ''} />
                  {selectedPaper.isFavorite ? 'Favorited' : 'Favourite'}
                </button>
                <button onClick={() => toggleOffline(selectedPaper)} className={cn('btn btn-outline py-3 text-sm gap-2', selectedPaper.offlineSaved && 'border-green-500 text-green-600')}>
                  {selectedPaper.offlineSaved ? <WifiOff size={15} /> : <Download size={15} />}
                  {selectedPaper.offlineSaved ? 'Remove Offline' : 'Save Offline'}
                </button>
                <button onClick={() => sharePaper(selectedPaper)} className="btn btn-outline py-3 text-sm gap-2">
                  <Share2 size={15} /> Share
                </button>
              </div>

              <button onClick={() => { navigate(`/papers/${selectedPaper.id}`); setSelectedPaper(null) }}
                className="btn btn-accent w-full py-3 font-bold gap-2">
                <Eye size={16} /> View Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && <UploadPaperModal onClose={() => { setShowUpload(false); fetchPapers() }} />}
    </div>
  )
}
