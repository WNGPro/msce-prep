import React, { useState } from 'react'
import { Star, Sparkles, Microscope, Brain, BarChart3, Image, Check, Loader2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PREMIUM_PLANS, initiatePayment, generateTxRef } from '../lib/paychangu'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

const FEATURES = [
  { icon: <Sparkles size={18} />, label: 'AI Exercise & Flashcard Generator', free: false },
  { icon: <Brain size={18} />, label: 'AI Tutor', free: false },
  { icon: <Microscope size={18} />, label: 'Practical Experiment Visualizations', free: false },
  { icon: <BarChart3 size={18} />, label: 'Advanced Progress Analytics', free: false },
  { icon: <Image size={18} />, label: 'Custom Profile Picture', free: false },
  { icon: '📄', label: 'Full Past Papers Library', free: true },
  { icon: '🃏', label: 'Flashcard & Exercise Builder', free: true },
  { icon: '📊', label: 'MSCE Grade Predictions', free: true },
  { icon: '🏆', label: 'School & National Leaderboard', free: true },
  { icon: '💬', label: 'Community Forum', free: true },
  { icon: '📶', label: 'Full Offline Access', free: true },
]

export default function Premium() {
  const { profile, user } = useAuth()
  const [selected, setSelected] = useState<'monthly' | 'termly'>('termly')
  const [loading, setLoading] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [phone, setPhone] = useState('')

  const plan = PREMIUM_PLANS[selected]

  const handleUpgrade = async () => {
    if (!profile || !user) return
    if (!phone.trim()) { toast.error('Please enter your Airtel/TNM phone number'); return }

    setLoading(true)
    const txRef = generateTxRef(user.id, selected)
    const [firstName, ...rest] = (profile.full_name || 'MSCE Student').split(' ')

    const result = await initiatePayment({
      amount: plan.price,
      currency: plan.currency,
      email: user.email || '',
      first_name: firstName,
      last_name: rest.join(' ') || 'Student',
      callback_url: `${window.location.origin}/api/paychangu-callback`,
      return_url: `${window.location.origin}/premium?paid=true`,
      tx_ref: txRef,
      customization: {
        title: `MSCE Prep ${plan.label}`,
        description: plan.description,
      }
    })

    if (result?.payment_url) {
      window.location.href = result.payment_url
    } else {
      // Fallback - show manual payment instructions
      toast.info('Payment gateway unavailable. Contact wngplays@gmail.com to upgrade manually.')
    }
    setLoading(false)
  }

  if (profile?.is_premium) return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in text-center">
      <div className="text-6xl mb-4">⭐</div>
      <h1 className="text-3xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>You're Premium!</h1>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>You have full access to all MSCE Prep features.</p>
      <div className="card rounded-2xl p-6">
        <h2 className="font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>Your Premium Features</h2>
        <div className="space-y-3 text-left">
          {FEATURES.filter(f => !f.free).map(f => (
            <div key={typeof f.label === 'string' ? f.label : ''} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-500" style={{ background: 'rgba(233,174,52,0.1)' }}>
                {typeof f.icon === 'string' ? f.icon : f.icon}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{f.label}</span>
              <Check size={14} className="ml-auto text-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: 'rgba(233,174,52,0.15)', color: '#92600a' }}>
          <Star size={14} className="text-amber-500 fill-current" /> Premium
        </div>
        <h1 className="text-3xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>
          Unlock AI-Powered Preparation
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Get the full MSCE Prep experience with AI tools built on real past paper data
        </p>
      </div>

      {/* Plan Toggle */}
      <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--surface-2)' }}>
        {(['monthly', 'termly'] as const).map(p => (
          <button key={p} onClick={() => setSelected(p)}
            className={cn('flex-1 py-3 rounded-lg text-sm font-semibold transition-all', selected === p ? 'text-white shadow' : 'text-[var(--text-muted)]')}
            style={selected === p ? { background: '#1f3d5d' } : {}}>
            {p === 'monthly' ? 'Monthly' : 'Per Term'}
            {p === 'termly' && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(233,174,52,0.3)', color: '#92600a' }}>Save 20%</span>}
          </button>
        ))}
      </div>

      {/* Price */}
      <div className="rounded-3xl p-8 text-center mb-6" style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' }}>
        <div className="text-5xl font-bold font-display text-white mb-1">
          MK{plan.price.toLocaleString()}
        </div>
        <div className="text-white/60 text-sm mb-1">{plan.label}</div>
        <div className="text-white/50 text-xs">{plan.description}</div>
      </div>

      {/* Features */}
      <div className="card rounded-2xl p-5 mb-6">
        <h2 className="font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>What you get</h2>
        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                !f.free ? 'text-amber-500' : 'text-green-500')}
                style={{ background: !f.free ? 'rgba(233,174,52,0.1)' : 'rgba(22,163,74,0.1)' }}>
                {typeof f.icon === 'string' ? <span className="text-base">{f.icon}</span> : f.icon}
              </div>
              <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{f.label}</span>
              <div className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', !f.free ? 'badge-accent' : 'badge-success')}>
                {!f.free ? '✨ Premium' : '✓ Free'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button onClick={() => setShowPayModal(true)} className="btn btn-accent w-full py-4 text-base font-bold">
        <Star size={18} className="fill-current" /> Upgrade for MK{plan.price.toLocaleString()}
      </button>
      <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
        Pay securely via Airtel Money · No hidden fees · Cancel anytime
      </p>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-slide-up" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Confirm Payment</h2>
              <button onClick={() => setShowPayModal(false)} className="p-2 rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--surface-2)' }}>
                <div className="font-bold font-display text-2xl" style={{ color: 'var(--text-primary)' }}>MK{plan.price.toLocaleString()}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.label}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Airtel/TNM Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="input w-full" placeholder="+265 9XX XXX XXX" type="tel" />
              </div>
              <button onClick={handleUpgrade} disabled={loading} className="btn btn-accent w-full py-3 font-bold">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Pay Now'}
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Powered by PayChangu · Secure payment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
