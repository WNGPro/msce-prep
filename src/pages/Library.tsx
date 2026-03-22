import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, BookOpen, Layers, ClipboardList, FileText, Star, CheckCircle, WifiOff, Upload, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUBJECTS, cn } from '../lib/utils'
import { toast } from 'sonner'

type LibTab = 'papers' | 'flashcards' | 'quizzes' | 'materials'

const TABS: { key: LibTab; label: string; icon: React.ReactNode }[] = [
  { key: 'papers', label: 'Past Papers', icon: <FileText size={15} /> },
  { key: 'flashcards', label: 'Flashcards', icon: <Layers size={15} /> },
  { key: 'quizzes', label: 'Quizzes', icon: <ClipboardList size={15} /> },
  { key: 'materials', label: 'Materials', icon: <BookOpen size={15} /> },
]

export default function Library() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
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

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: p }, { data: fd }, { data: q }, { data: m }, { data: prog }] = await Promise.all([
      supabase.from('papers').select('*').eq('is_published', true).order('year', { ascending: false }),
      supabase.from('flashcard_decks').select('*, profiles(full_name)').eq('is_public', true).order('created_at', { ascending: false }),
      supabase.from('community_quizzes').select('*, profiles(full_name)').eq('is_public', true).order('created_at', { ascending: false }),
      supabase.from('library_materials').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      user ? supabase.from('user_paper_progress').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ])
    setPapers(p || [])
    setFlashcardDecks(fd || [])
    setQuizzes(q || [])
    setMaterials(m || [])
    const progMap: Record<string, any> = {}
    const favSet = new Set<string>()
    ;(prog || []).forEach((r: any) => {
      progMap[r.paper_id] = r
      if (r.is_favorite) favSet.add(r.paper_id)
    })
    setProgress(progMap)
    setFavorites(favSet)
    setLoading(false)
  }

  async function toggleFavorite(paperId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) return
    const isFav = favorites.has(paperId)
    const newFavs = new Set(favorites)
    isFav ? newFavs.delete(paperId) : newFavs.add(paperId)
    setFavorites(newFavs)
    await supabase.from('user_paper_progress').upsert({
      user_id: user.id, paper_id: paperId, is_favorite: !isFav
    }, { onConflict: 'user_id,paper_id' })
  }

  async function toggleComplete(paperId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) return
    const current = progress[paperId]
    const newVal = !current?.is_completed
    setProgress(p => ({ ...p, [paperId]: { ...p[paperId], is_completed: newVal } }))
    await supabase.from('user_paper_progress').upsert({
      user_id: user.id, paper_id: paperId,
      is_completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null
    }, { onConflict: 'user_id,paper_id' })
    toast.success(newVal ? 'Marked as complete ✓' : 'Marked as incomplete')
  }

  const filterItems = (items: any[]) => items.filter(item => {
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase())
    const matchSubject = !subjectFilter || item.subject === subjectFilter
    return matchSearch && matchSubject
  })

  const filteredPapers = filterItems(papers)
  const subject = (s: string) => SUBJECTS.find(x => x.value === s)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Library</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Past papers, flashcard decks, quizzes & study materials</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={tab === t.key
                ? { background: '#1f3d5d', color: 'white' }
                : { color: 'var(--text-muted)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div className="px-4 mb-4 flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm" placeholder={`Search ${tab}...`} />
        </div>
        <select className="input text-sm w-36" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
        </select>
      </div>

      <div className="px-4">

        {/* PAST PAPERS */}
        {tab === 'papers' && (
          <>
            {loading ? (
              <div className="grid gap-3">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)}
              </div>
            ) : filteredPapers.length === 0 ? (
              <EmptyState icon="📄" title="No papers yet" sub="Papers will appear here once added by admin" />
            ) : (
              <div className="grid gap-3">
                {filteredPapers.map(paper => {
                  const sub = subject(paper.subject)
                  const prog = progress[paper.id]
                  const isExpanded = expandedPaper === paper.id
                  const isFav = favorites.has(paper.id)
                  const isComplete = prog?.is_completed

                  return (
                    <div key={paper.id}>
                      {/* Paper card */}
                      <button onClick={() => setExpandedPaper(isExpanded ? null : paper.id)}
                        className="w-full card rounded-2xl p-4 text-left transition-all"
                        style={{ border: isExpanded ? '2px solid #e9ae34' : '2px solid transparent' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: 'var(--surface-2)' }}>
                            {sub?.emoji || '📄'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{paper.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {sub?.label} · {paper.year} · {paper.paper_type === 'msce_official' ? 'MANEB Official' : 'School Paper'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={e => toggleFavorite(paper.id, e)}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: isFav ? '#e9ae34' : 'var(--text-muted)' }}>
                                  <Star size={14} fill={isFav ? '#e9ae34' : 'none'} />
                                </button>
                                {isComplete && <CheckCircle size={16} style={{ color: '#16a34a' }} />}
                              </div>
                            </div>
                            {/* Topics */}
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

                      {/* Expanded card */}
                      {isExpanded && (
                        <div className="card rounded-2xl p-4 mt-1 border-l-4 animate-fade-in"
                          style={{ borderLeftColor: '#e9ae34' }}>

                          {/* Notes */}
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>YOUR NOTES</p>
                          <textarea
                            defaultValue={prog?.notes || ''}
                            onBlur={async e => {
                              if (!user) return
                              await supabase.from('user_paper_progress').upsert({
                                user_id: user.id, paper_id: paper.id, notes: e.target.value
                              }, { onConflict: 'user_id,paper_id' })
                              toast.success('Note saved')
                            }}
                            className="input text-sm mb-4 min-h-[60px]"
                            placeholder="Leave a note about this paper..." />

                          {/* Progress */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: isComplete ? '100%' : '0%', background: '#16a34a' }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: isComplete ? '#16a34a' : 'var(--text-muted)' }}>
                              {isComplete ? '✓ Complete' : 'Not started'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button onClick={e => toggleComplete(paper.id, e)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                              style={isComplete
                                ? { background: '#16a34a20', color: '#16a34a', border: '1.5px solid #16a34a40' }
                                : { background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                              {isComplete ? '✓ Mark Incomplete' : 'Mark Complete'}
                            </button>
                            <button onClick={() => navigate(`/papers/${paper.id}`)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
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

        {/* FLASHCARD DECKS */}
        {tab === 'flashcards' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{flashcardDecks.length} shared decks</p>
              <button onClick={() => navigate('/create?tab=flashcards')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                <Plus size={13} /> Build Deck
              </button>
            </div>
            {flashcardDecks.length === 0 ? (
              <EmptyState icon="🃏" title="No flashcard decks yet"
                sub="Create a deck and share it — it'll appear here after approval"
                action={{ label: 'Build a Deck', onClick: () => navigate('/create?tab=flashcards') }} />
            ) : (
              <div className="grid gap-3">
                {filterItems(flashcardDecks).map(deck => (
                  <button key={deck.id} onClick={() => navigate(`/flashcards/${deck.id}`)}
                    className="card rounded-2xl p-4 text-left w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'var(--surface-2)' }}>
                        {subject(deck.subject)?.emoji || '🃏'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{deck.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {subject(deck.subject)?.label} · {deck.card_count || 0} cards · by {(deck.profiles as any)?.full_name || 'Student'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: '#e9ae3420', color: '#b8861f' }}>
                        Study →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* QUIZZES */}
        {tab === 'quizzes' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{quizzes.length} shared quizzes</p>
              <button onClick={() => navigate('/create?tab=quizzes')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                <Plus size={13} /> Build Quiz
              </button>
            </div>
            {quizzes.length === 0 ? (
              <EmptyState icon="📝" title="No quizzes yet"
                sub="Build a quiz and share it with other students"
                action={{ label: 'Build a Quiz', onClick: () => navigate('/create?tab=quizzes') }} />
            ) : (
              <div className="grid gap-3">
                {filterItems(quizzes).map(quiz => (
                  <button key={quiz.id} onClick={() => navigate(`/take-test?quiz=${quiz.id}`)}
                    className="card rounded-2xl p-4 text-left w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'var(--surface-2)' }}>
                        {subject(quiz.subject)?.emoji || '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{quiz.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {subject(quiz.subject)?.label} · {quiz.question_count || 0} questions · by {(quiz.profiles as any)?.full_name || 'Student'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: '#1f3d5d20', color: '#1f3d5d' }}>
                        Take →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* MATERIALS */}
        {tab === 'materials' && (
          <div>
            <div className="card rounded-2xl p-5 mb-4 border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
              <div className="flex items-start gap-3">
                <Upload size={20} style={{ color: '#e9ae34', flexShrink: 0 }} />
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Share Study Material</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Upload notes, summaries, or textbook excerpts. All uploads are reviewed before publishing.
                  </p>
                  <button onClick={() => navigate('/uploads')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                    Upload Material
                  </button>
                </div>
              </div>
            </div>
            {materials.length === 0 ? (
              <EmptyState icon="📚" title="No materials yet" sub="Approved study materials will appear here" />
            ) : (
              <div className="grid gap-3">
                {filterItems(materials).map(mat => (
                  <a key={mat.id} href={mat.file_url} target="_blank" rel="noopener noreferrer"
                    className="card rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'var(--surface-2)' }}>
                      {subject(mat.subject)?.emoji || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{mat.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {subject(mat.subject)?.label} · {mat.material_type}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: '#e9ae34' }}>Open →</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="card rounded-2xl p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      {action && (
        <button onClick={action.onClick}
          className="px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#e9ae34', color: '#1f3d5d' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
