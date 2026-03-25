import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, BarChart3, Trophy, Users, ChevronRight, CheckCircle, Menu, X, ArrowRight } from 'lucide-react'

const SUBJECTS = [
  { emoji: '📐', label: 'Mathematics', color: '#f59e0b' },
  { emoji: '📚', label: 'English',     color: '#3b82f6' },
  { emoji: '🧬', label: 'Biology',     color: '#10b981' },
  { emoji: '🧪', label: 'Chemistry',   color: '#8b5cf6' },
  { emoji: '⚛️', label: 'Physics',     color: '#ec4899' },
  { emoji: '🌍', label: 'Geography',   color: '#f97316' },
  { emoji: '🌾', label: 'Agriculture', color: '#84cc16' },
  { emoji: '📜', label: 'History',     color: '#06b6d4' },
  { emoji: '💼', label: 'Business',    color: '#e9ae34' },
  { emoji: '💻', label: 'Computer Studies', color: '#6366f1' },
  { emoji: '🗣️', label: 'Chichewa',   color: '#ef4444' },
  { emoji: '⚗️', label: 'Physical Science', color: '#14b8a6' },
]

const FEATURES = [
  {
    icon: <BookOpen size={22} />,
    title: 'Real MSCE Past Papers',
    desc: 'Access actual MANEB papers organised by subject and year. Study the real thing, not made-up exercises.',
    color: '#e9ae34',
  },
  {
    icon: <span className="text-xl">🃏</span>,
    title: 'Flashcard & Quiz Builder',
    desc: 'Build your own revision decks and share them with other students. Community-powered, admin-verified.',
    color: '#3b82f6',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'MSCE Grade Predictions',
    desc: 'Your performance converts to real MSCE grades (1–9). See your predicted Division from your best six subjects.',
    color: '#10b981',
  },
  {
    icon: <Trophy size={22} />,
    title: 'School Leaderboard',
    desc: 'Compete against students across Malawi. Your school\'s rank updates with every test you complete.',
    color: '#8b5cf6',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign up free', desc: 'Choose your subjects, set your school, pick your weekly test day.' },
  { step: '02', title: 'Study past papers', desc: 'Browse the library by subject and year. Mark favourites, take notes, track progress.' },
  { step: '03', title: 'Build & practise', desc: 'Create flashcard decks and quizzes. Share them with the community or keep them private.' },
  { step: '04', title: 'Track your grade', desc: 'Your dashboard shows your predicted MSCE grade per subject and your best six total in real time.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#0d1a26', color: 'white', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? 'rgba(13,26,38,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: '#e9ae34' }}>🎓</div>
            <div>
              <span className="font-bold text-sm tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'white' }}>MSCE Prep</span>
              <p className="text-xs leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>The Easiest Way to Get 6 Pts.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.target as any).style.color='white'} onMouseLeave={e => (e.target as any).style.color='rgba(255,255,255,0.6)'}>
              How it works
            </a>
            <a href="#subjects" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.target as any).style.color='white'} onMouseLeave={e => (e.target as any).style.color='rgba(255,255,255,0.6)'}>
              Subjects
            </a>
            <button onClick={() => navigate('/auth')} className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Sign In
            </button>
            <button onClick={() => navigate('/auth')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: '#e9ae34', color: '#1f3d5d' }}>
              Get Started →
            </button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(o => !o)} style={{ color: 'white' }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-5 pb-5 grid gap-3" style={{ background: 'rgba(13,26,38,0.98)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="py-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>How it works</a>
            <a href="#subjects" onClick={() => setMenuOpen(false)} className="py-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Subjects</a>
            <button onClick={() => navigate('/auth')} className="py-3 rounded-xl text-sm font-bold" style={{ background: '#e9ae34', color: '#1f3d5d' }}>
              Get Started Free
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-5">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(233,174,52,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(233,174,52,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(233,174,52,0.08) 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
            style={{ background: 'rgba(233,174,52,0.12)', border: '1px solid rgba(233,174,52,0.3)', color: '#e9ae34' }}>
            🇲🇼 Built for Malawian Form 4 Students
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            The easiest way<br />
            <span style={{ color: '#e9ae34' }}>to get 6 points.</span>
          </h1>

          <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Real MSCE past papers. Flashcard and quiz builders. Grade predictions based on your actual performance. Free, offline-capable, built for Malawi.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <button onClick={() => navigate('/auth')}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: '#e9ae34', color: '#1f3d5d', boxShadow: '0 0 40px rgba(233,174,52,0.25)' }}>
              Start Preparing Free <ArrowRight size={18} />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
              See how it works
            </button>
          </div>

          {/* App mockup */}
          <div className="relative mx-auto max-w-2xl">
            <div className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: '#132030', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#0d1a26', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                  {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
                </div>
                <div className="flex-1 mx-3 px-3 py-1 rounded-lg text-xs text-center" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                  msce-prep.vercel.app/dashboard
                </div>
              </div>
              {/* Dashboard mockup */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Good morning,</p>
                    <p className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'white' }}>Wongani 👋</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(233,174,52,0.15)' }}>
                    <span>🔥</span>
                    <span className="font-bold text-sm" style={{ color: '#e9ae34' }}>7</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>day streak</span>
                  </div>
                </div>
                {/* Grade card */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(233,174,52,0.08)', border: '1px solid rgba(233,174,52,0.2)' }}>
                  <p className="text-xs font-bold mb-3" style={{ color: '#e9ae34' }}>IF YOU SAT MSCE TODAY</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[['Mathematics','2','#22c55e'],['Chemistry','3','#22c55e'],['Biology','4','#3b82f6']].map(([sub, grade, color]) => (
                      <div key={sub} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-lg font-bold" style={{ color: color as string }}>{grade}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Best Six Total</span>
                    <span className="font-bold" style={{ color: '#e9ae34' }}>18 pts — Division 2</span>
                  </div>
                </div>
                {/* Subject chips */}
                <div className="flex gap-2 flex-wrap">
                  {['📐 Maths','🧪 Chemistry','🧬 Biology','📚 English'].map(s => (
                    <span key={s} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 hidden sm:flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl"
              style={{ background: '#1f3d5d', border: '1px solid rgba(233,174,52,0.3)' }}>
              <CheckCircle size={16} style={{ color: '#22c55e' }} />
              <span className="text-xs font-semibold text-white">Free & works offline</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section id="subjects" className="py-20 px-5" style={{ background: '#0d1a26' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: '#e9ae34' }}>SUBJECTS COVERED</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              All 18 MSCE subjects
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Papers, flashcards and quizzes available across every MANEB subject
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {SUBJECTS.map(s => (
              <div key={s.label} className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-5" style={{ background: '#0a1520' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: '#e9ae34' }}>WHAT YOU GET</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything you need to pass
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 rounded-3xl transition-all hover:translate-y-[-2px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}20`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'white' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-5" style={{ background: '#0d1a26' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: '#e9ae34' }}>THE PROCESS</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Simple. Focused. Effective.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex gap-4 p-5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-3xl font-black flex-shrink-0 leading-none"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(233,174,52,0.2)' }}>
                  {item.step}
                </span>
                <div>
                  <h3 className="font-bold mb-1.5" style={{ color: 'white' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-20 px-5" style={{ background: '#0a1520' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold mb-4 tracking-widest" style={{ color: '#e9ae34' }}>OUR MISSION</p>
          <h2 className="text-2xl font-bold mb-6 leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            "Every student in Malawi deserves access to serious exam preparation — regardless of their school or location."
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            MSCE Prep is an early-stage platform built by a student founder. We're growing, improving, and adding content every week. The app is free, there are no false promises, and we will never show you fabricated statistics.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Free to use','No fake stats','Offline capable','Made in Malawi 🇲🇼'].map(tag => (
              <span key={tag} className="text-xs px-4 py-2 rounded-full font-semibold"
                style={{ background: 'rgba(233,174,52,0.1)', border: '1px solid rgba(233,174,52,0.25)', color: '#e9ae34' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #0d1a26 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(233,174,52,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-xl mx-auto relative">
          <div className="text-5xl mb-6">🎓</div>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to start preparing?
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Free. No credit card. Works on any phone.
          </p>
          <button onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
            style={{ background: '#e9ae34', color: '#1f3d5d', boxShadow: '0 0 40px rgba(233,174,52,0.3)' }}>
            Create Free Account <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-8 border-t" style={{ background: '#0d1a26', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: '#e9ae34' }}>🎓</div>
            <span className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'white' }}>MSCE Prep</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 MSCE Prep · Built for Malawian students · <a href="mailto:wngplays@gmail.com" style={{ color: 'rgba(255,255,255,0.4)' }}>wngplays@gmail.com</a>
          </p>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            🇲🇼 Made in Malawi
          </div>
        </div>
      </footer>
    </div>
  )
}
