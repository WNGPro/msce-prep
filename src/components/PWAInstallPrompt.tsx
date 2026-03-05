import React, { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('msce-pwa-dismissed') === 'true'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  const install = async () => {
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('msce-pwa-dismissed', 'true')
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-20 lg:w-80 rounded-2xl shadow-2xl p-4 border animate-slide-up z-40 flex items-center gap-3"
      style={{ background: 'var(--surface)', borderColor: '#e9ae34' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#e9ae34' }}>🎓</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>Install MSCE Prep</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Study offline anytime, anywhere</p>
      </div>
      <button onClick={install} className="btn btn-accent text-xs px-3 py-2 flex-shrink-0">
        <Download size={14} /> Install
      </button>
      <button onClick={dismiss} className="p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        <X size={14} />
      </button>
    </div>
  )
}
