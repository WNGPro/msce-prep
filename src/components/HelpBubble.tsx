import React, { useState, useRef, useEffect } from 'react'
import { X, HelpCircle, MessageCircle, BookOpen, Mail, ChevronDown, ChevronUp } from 'lucide-react'

const FAQS = [
  { q: 'How do MSCE grades work?', a: 'MSCE uses grades 1–9 per subject, where 1 is the highest. Your Division is calculated from your best 6 subjects — Division 1 is ≤9 points, Division 2 is 10–18, Division 3 is 19–27.' },
  { q: 'How do I earn XP?', a: 'You earn XP by completing tests, reviewing flashcards, building decks, uploading papers, and logging in daily. Every 200 XP = 1 level.' },
  { q: 'How does the streak work?', a: 'Your streak increases by 1 for every consecutive day you do any activity on the app. Miss a day and it resets to 1.' },
  { q: 'Can I use the app offline?', a: 'Yes — papers you\'ve opened before are cached. Flashcard decks you\'ve built are saved locally and sync when you reconnect.' },
  { q: 'How do I share a flashcard deck?', a: 'When building a deck in Create, toggle "Share with Library". It goes to admin review and appears publicly once approved.' },
  { q: 'How do I report a problem?', a: 'Email wngplays@gmail.com with a description of the issue. Screenshots are helpful.' },
]

export default function HelpBubble() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const bubbleRef = useRef<HTMLButtonElement>(null)
  const hasDragged = useRef(false)

  // Position bubble bottom-right on mount
  useEffect(() => {
    setPos({ x: window.innerWidth - 72, y: window.innerHeight - 120 })
  }, [])

  function onMouseDown(e: React.MouseEvent) {
    hasDragged.current = false
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
    e.preventDefault()
  }

  function onTouchStart(e: React.TouchEvent) {
    hasDragged.current = false
    setDragging(true)
    const t = e.touches[0]
    dragStart.current = { x: t.clientX, y: t.clientY, px: pos.x, py: pos.y }
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true
      const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStart.current.px + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStart.current.py + dy))
      setPos({ x: newX, y: newY })
    }
    function onTouchMove(e: TouchEvent) {
      if (!dragging) return
      const t = e.touches[0]
      const dx = t.clientX - dragStart.current.x
      const dy = t.clientY - dragStart.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true
      const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStart.current.px + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStart.current.py + dy))
      setPos({ x: newX, y: newY })
    }
    function onUp() { setDragging(false) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  function handleClick() {
    if (hasDragged.current) return
    setOpen(o => !o)
  }

  if (hidden) {
    return (
      <button onClick={() => setHidden(false)}
        className="fixed bottom-24 right-4 z-50 text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        ? Help
      </button>
    )
  }

  return (
    <>
      {/* Bubble */}
      <button
        ref={bubbleRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={handleClick}
        className="fixed z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform"
        style={{
          left: pos.x,
          top: pos.y,
          background: open ? '#1f3d5d' : '#e9ae34',
          cursor: dragging ? 'grabbing' : 'grab',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          transform: open ? 'scale(0.95)' : 'scale(1)'
        }}>
        {open
          ? <X size={20} color="white" />
          : <HelpCircle size={22} color="#1f3d5d" />
        }
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed z-40 rounded-3xl shadow-2xl overflow-hidden"
          style={{
            width: 'min(340px, calc(100vw - 32px))',
            maxHeight: '70vh',
            bottom: window.innerHeight - pos.y + 16,
            right: window.innerWidth - pos.x - 56,
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)', background: '#1f3d5d' }}>
            <div className="flex items-center gap-2">
              <HelpCircle size={16} color="#e9ae34" />
              <span className="font-bold text-sm text-white">Help & Support</span>
            </div>
            <button onClick={() => setHidden(true)} className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              Hide
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 52px)' }}>

            {/* Quick links */}
            <div className="p-3 grid grid-cols-2 gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <a href="mailto:wngplays@gmail.com"
                className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                <Mail size={14} style={{ color: '#e9ae34' }} /> Email Us
              </a>
              <a href="https://wa.me" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                <MessageCircle size={14} style={{ color: '#16a34a' }} /> WhatsApp
              </a>
            </div>

            {/* FAQs */}
            <div className="p-3">
              <p className="text-xs font-bold mb-2 tracking-wider" style={{ color: 'var(--text-muted)' }}>
                FREQUENTLY ASKED
              </p>
              <div className="grid gap-1.5">
                {FAQS.map((faq, i) => (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-3 text-left"
                      style={{ background: expandedFaq === i ? 'var(--surface-2)' : 'transparent' }}>
                      <span className="text-xs font-semibold pr-2" style={{ color: 'var(--text-primary)' }}>
                        {faq.q}
                      </span>
                      {expandedFaq === i
                        ? <ChevronUp size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        : <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      }
                    </button>
                    {expandedFaq === i && (
                      <div className="px-3 pb-3">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-3 pb-4 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                MSCE Prep · Early Stage · Built in Malawi 🇲🇼
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
