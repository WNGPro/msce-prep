import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, CheckCircle, Download, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Paper } from '../lib/supabase'
import { getSubject } from '../lib/utils'
import { toast } from 'sonner'

export default function PaperViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    fetchPaper()
  }, [id])

  async function fetchPaper() {
    const { data } = await supabase.from('papers').select('*').eq('id', id).single()
    if (data) {
      setPaper(data as Paper)
      // Check completion status
      if (profile) {
        const { data: prog } = await supabase
          .from('user_paper_progress').select('is_completed')
          .eq('user_id', profile.user_id).eq('paper_id', id).single()
        if (prog) setIsComplete(prog.is_completed)
      }
    }
    setLoading(false)
  }

  async function toggleComplete() {
    if (!profile || !paper) return
    const next = !isComplete
    await supabase.from('user_paper_progress').upsert({
      user_id: profile.user_id, paper_id: paper.id,
      is_completed: next, completed_at: next ? new Date().toISOString() : null
    }, { onConflict: 'user_id,paper_id' })
    setIsComplete(next)
    toast.success(next ? '✓ Paper marked as complete!' : 'Marked as incomplete')
  }

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setFullscreen(f => !f)
  }

  // Build Google Drive preview URL
  const getViewerUrl = () => {
    if (!paper?.file_url) return null
    // If it's already a Google Drive URL, convert to preview
    if (paper.file_url.includes('drive.google.com')) {
      const idMatch = paper.file_url.match(/[-\w]{25,}/)
      if (idMatch) return `https://drive.google.com/file/d/${idMatch[0]}/preview`
    }
    // Otherwise use Google Docs viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(paper.file_url)}&embedded=true`
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  )

  if (!paper) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <p style={{ color: 'var(--text-muted)' }}>Paper not found.</p>
      <button onClick={() => navigate('/papers')} className="btn btn-primary">Back to Library</button>
    </div>
  )

  const subj = getSubject(paper.subject)
  const viewerUrl = getViewerUrl()

  return (
    <div ref={containerRef} className="flex flex-col h-full" style={{ background: 'var(--background)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/papers')} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{subj.emoji}</span>
          <div className="min-w-0">
            <div className="font-semibold text-sm font-display truncate" style={{ color: 'var(--text-primary)' }}>{paper.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{subj.label} · {paper.year}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--text-secondary)' }} disabled={zoom <= 0.5}>
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-medium px-2" style={{ color: 'var(--text-secondary)' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--text-secondary)' }} disabled={zoom >= 2}>
            <ZoomIn size={16} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors hidden sm:flex" style={{ color: 'var(--text-secondary)' }}>
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={toggleComplete} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ml-1 ${isComplete ? 'text-green-700 dark:text-green-400' : ''}`}
            style={isComplete ? { background: 'rgba(22,163,74,0.1)', border: '1.5px solid rgba(22,163,74,0.3)' } : { background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <CheckCircle size={14} className={isComplete ? 'text-green-500' : ''} />
            {isComplete ? 'Complete' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden relative" style={{ background: '#e8e8e8' }}
        onContextMenu={e => e.preventDefault()}>
        {iframeLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'var(--background)', zIndex: 10 }}>
            <Loader2 size={32} className="animate-spin mb-3 text-amber-500" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading paper...</p>
          </div>
        )}
        {viewerUrl ? (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', height: `${100 / zoom}%`, width: `${100 / zoom}%` }}>
            <iframe
              ref={iframeRef}
              src={viewerUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIframeLoading(false)}
              title={paper.title}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p style={{ color: 'var(--text-muted)' }}>No file available for this paper.</p>
            <button onClick={() => navigate('/papers')} className="btn btn-outline">Back to Library</button>
          </div>
        )}
      </div>
    </div>
  )
}
