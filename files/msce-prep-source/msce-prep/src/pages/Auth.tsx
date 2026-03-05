import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

type Tab = 'signin' | 'signup' | 'phone'

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>((params.get('tab') === 'signup' ? 'signup' : 'signin'))
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  const { signIn, signUp, signInWithGoogle, signInWithApple, signInWithPhone, verifyOtp } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (tab === 'signin') {
      const { error } = await signIn(form.email, form.password)
      if (error) toast.error(error.message)
      else navigate('/dashboard')
    } else {
      if (!form.name.trim()) { toast.error('Please enter your full name'); setLoading(false); return }
      if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return }
      const { error } = await signUp(form.email, form.password, form.name)
      if (error) toast.error(error.message)
      else { toast.success('Account created! Please check your email to verify.'); navigate('/onboarding') }
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) { toast.error(error.message); setLoading(false) }
  }

  const handleApple = async () => {
    setLoading(true)
    const { error } = await signInWithApple()
    if (error) { toast.error(error.message); setLoading(false) }
  }

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!otpSent) {
      const { error } = await signInWithPhone(phone)
      if (error) toast.error(error.message)
      else { setOtpSent(true); toast.success('OTP sent to your phone!') }
    } else {
      const { error } = await verifyOtp(phone, otp)
      if (error) toast.error(error.message)
      else navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white" style={{ background: 'linear-gradient(160deg, #0d1e2e 0%, #1f3d5d 60%, #2d4f8a 100%)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to home</span>
        </button>
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#e9ae34' }}>🎓</div>
            <div>
              <div className="font-bold text-xl font-display">MSCE Prep</div>
              <div className="text-white/50 text-sm">The Easiest Way to Get 6 Pts.</div>
            </div>
          </div>
          <h2 className="text-4xl font-bold font-display mb-4 leading-tight">
            Prepare smarter,<br />
            <span style={{ color: '#e9ae34' }}>score higher.</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Access real MSCE past papers, track your grade predictions, and study with purpose.
          </p>
          <div className="mt-8 space-y-3">
            {['Real MSCE past papers from all subjects', 'Grade 1–9 predictions updated as you practice', 'Compete with classmates on the leaderboard'].map(item => (
              <div key={item} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#e9ae34' }}>
                  <span className="text-xs text-navy-800 font-bold">✓</span>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} MSCE Prep. Built for Malawian students.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile back */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-sm lg:hidden" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Back
          </button>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: 'var(--surface-2)' }}>
            <button onClick={() => setTab('signin')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'signin' ? 'bg-white shadow-sm text-navy-800 dark:bg-navy-700 dark:text-white' : 'text-[var(--text-muted)]'}`}>
              Sign In
            </button>
            <button onClick={() => setTab('signup')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'signup' ? 'bg-white shadow-sm text-navy-800 dark:bg-navy-700 dark:text-white' : 'text-[var(--text-muted)]'}`}>
              Create Account
            </button>
            <button onClick={() => setTab('phone')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'phone' ? 'bg-white shadow-sm text-navy-800 dark:bg-navy-700 dark:text-white' : 'text-[var(--text-muted)]'}`}>
              Phone
            </button>
          </div>

          <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
            {tab === 'signin' ? 'Welcome back' : tab === 'signup' ? 'Create your account' : 'Sign in with phone'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {tab === 'signin' ? 'Sign in to continue your MSCE preparation' : tab === 'signup' ? 'Start your MSCE preparation for free' : 'Enter your phone number to receive an OTP'}
          </p>

          {/* Phone tab */}
          {tab === 'phone' ? (
            <form onSubmit={handlePhone} className="space-y-4">
              {!otpSent ? (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input pl-10" placeholder="+265 XXX XXX XXX" required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Enter OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="input text-center text-xl tracking-widest" placeholder="000000" maxLength={6} required />
                  <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>OTP sent to {phone}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
                {loading ? <Loader2 size={16} className="animate-spin" /> : otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <>
              {/* OAuth buttons */}
              <div className="space-y-3 mb-6">
                <button onClick={handleGoogle} disabled={loading} className="btn btn-outline w-full py-3 gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>
                <button onClick={handleApple} disabled={loading} className="btn btn-outline w-full py-3 gap-3">
                  <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.6 62.2 214.3 80.1 162.6c24.4-69.1 88.9-136.2 159.2-136.2 72.6 0 108.2 57.8 165.9 57.8 56 0 90.9-57.8 165.9-57.8 54.9 0 111.8 40.5 146.9 93.6z"/></svg>
                  Continue with Apple
                </button>
              </div>

              <div className="relative flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or with email</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmail} className="space-y-4">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input value={form.name} onChange={f('name')} type="text" className="input pl-10" placeholder="Wongani Mbamba" required />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input value={form.email} onChange={f('email')} type="email" className="input pl-10" placeholder="student@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input value={form.password} onChange={f('password')} type={showPass ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : tab === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
