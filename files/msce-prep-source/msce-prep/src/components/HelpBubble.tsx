import React, { useState, useRef, useEffect } from 'react'
import { HelpCircle, X, Minus, MessageCircle, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const FAQ_ITEMS = [
  { q: 'How do I save a paper offline?', a: 'Open any paper card and tap the "Save Offline" button. The paper will be available even without internet.' },
  { q: 'How does the MSCE grade prediction work?', a: 'Your average score per subject is converted to an MSCE grade (1–9). Grade 1 is the highest. Your best 6 subjects form your total points.' },
  { q: 'What is the weekly test?', a: 'A timed test held on your preferred day each week. It covers your priority subjects and contributes to your leaderboard rank.' },
  { q: 'How do I go premium?', a: 'Go to Settings → Premium or tap the "Upgrade" button in the sidebar. We accept Airtel Money via PayChangu.' },
  { q: 'Can I use the app without internet?', a: 'Yes! Papers you\'ve saved offline, your created flashcards and exercises, and your progress are all available offline.' },
]

export default function HelpBubble() {
  const [visible, setVisible] = useState(() => localStorage.getItem('msce-help-hidden') !== 'true')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [activeQ, setActiveQ] = useState<number | null>(null)
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize position to bottom-right
    const r = 24, b = 90
    setPos({ x: window.innerWidth - r - 56, y: window.innerHeight - b - 56 })
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    if (open) return
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, dragRef.current.startPosX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, dragRef.current.startPosY + dy))
      })
    }
    const onMouseUp = () => setDragging(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [dragging])

  const hide = () => {
    setVisible(false)
    setOpen(false)
    localStorage.setItem('msce-help-hidden', 'true')
  }

  if (!visible) return null

  return (
    <div
      ref={bubbleRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, cursor: dragging ? 'grabbing' : open ? 'default' : 'grab' }}
      onMouseDown={onMouseDown}
    >
      {/* Panel */}
      {open && (
        <div
          className="absolute bottom-16 right-0 w-80 rounded-2xl border shadow-2xl animate-scale-in"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h3 className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>Help & Support</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tap a question to expand</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl overflow-hidden border transition-colors" style={{ borderColor: activeQ === i ? '#e9ae34' : 'var(--border)' }}>
                <button
                  className="w-full flex items-center justify-between p-3 text-left text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setActiveQ(activeQ === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <ChevronRight size={14} className={cn('flex-shrink-0 transition-transform', activeQ === i && 'rotate-90')} style={{ color: 'var(--text-muted)' }} />
                </button>
                {activeQ === i && (
                  <div className="px-3 pb-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              More questions? Visit{' '}
              <a href="/forum" className="underline" style={{ color: '#e9ae34' }}>Community Forum</a>
            </p>
          </div>
        </div>
      )}

      {/* Bubble */}
      <div className="relative flex items-center gap-1">
        {!open && (
          <button onClick={hide} className="w-6 h-6 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            onMouseDown={e => e.stopPropagation()} title="Hide help bubble">
            <Minus size={10} />
          </button>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className={cn('w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105', open && 'rotate-12')}
          style={{ background: '#1f3d5d', color: 'white' }}
          onMouseDown={e => e.stopPropagation()}
          title="Help"
        >
          {open ? <X size={20} /> : <HelpCircle size={20} />}
        </button>
      </div>
    </div>
  )
}
