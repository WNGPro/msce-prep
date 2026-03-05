import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, BarChart3, Trophy, Users, CheckCircle, Wifi, WifiOff, Star } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setJoined(true)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(var(--background-rgb, 250,248,245),0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: '#e9ae34' }}>🎓</div>
            <span className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>MSCE Prep</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="btn btn-ghost text-sm" style={{ color: 'var(--text-secondary)' }}>Sign In</button>
            <button onClick={() => navigate('/auth?tab=signup')} className="btn btn-accent text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 border dark:text-amber-400"
            style={{ background: 'rgba(233,174,52,0.1)', borderColor: 'rgba(233,174,52,0.3)', color: '#92600a' }}>
            <Star size={14} className="text-amber-500" />
            Built for Malawian Form 4 Students
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Ace your{' '}
            <span className="gradient-text">MSCE exams</span>
            <br />with confidence.
          </h1>

          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Practice with real past papers, track your MSCE grade predictions, and build custom exercises.
            Free for every Malawian student.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/auth?tab=signup')} className="btn btn-accent px-8 py-4 text-base font-bold">
              Start Learning Free <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/auth')} className="btn btn-outline px-8 py-4 text-base">
              Sign In
            </button>
          </div>

          {/* Real stats only */}
          <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Free • No credit card required • Works offline
          </p>
        </div>
      </section>

      {/* App Screenshots Teaser */}
      <section className="py-16 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden border shadow-2xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Mock app preview */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-6 rounded-lg text-xs flex items-center px-3" style={{ background: 'var(--background)', color: 'var(--text-muted)' }}>
                msce.app
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              {[
                { icon: '📐', subject: 'Mathematics', grade: '2', score: '78%', color: '#8b5cf6' },
                { icon: '🧬', subject: 'Biology', grade: '3', score: '67%', color: '#10b981' },
                { icon: '⚛️', subject: 'Physics', grade: '4', score: '56%', color: '#6366f1' },
              ].map(item => (
                <div key={item.subject} className="rounded-xl p-4 border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold font-display text-sm" style={{ color: 'var(--text-primary)' }}>{item.subject}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold font-display" style={{ color: item.grade === '2' ? '#16a34a' : item.grade === '3' ? '#0d9488' : '#d97706' }}>
                        Grade {item.grade}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.score} avg score</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(233,174,52,0.1)', color: '#92600a' }}>MSCE</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: item.score, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything you need to pass
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Built specifically for MSCE. Not a generic app.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <BookOpen size={24} />, title: 'Real Past Papers', desc: 'MSCE official papers organized by subject and year. View inside the app, no external links.', color: '#3b82f6' },
              { icon: <BarChart3 size={24} />, title: 'MSCE Grade Prediction', desc: 'See your predicted Grade 1–9 per subject and your Best Six total in real time.', color: '#8b5cf6' },
              { icon: <Trophy size={24} />, title: 'School Leaderboard', desc: 'Compete with students from your school and nationally. Streaks and badges included.', color: '#f59e0b' },
              { icon: <Star size={24} />, title: 'Build Exercises', desc: 'Create your own flashcards, quizzes and exercises. Share them publicly after review.', color: '#10b981' },
              { icon: <WifiOff size={24} />, title: 'Works Offline', desc: 'Save papers offline and study anywhere. Your progress syncs when you reconnect.', color: '#ec4899' },
              { icon: <Users size={24} />, title: 'Community Forum', desc: 'Ask questions, share tips, and get updates directly from the MSCE Prep team.', color: '#06b6d4' },
            ].map(f => (
              <div key={f.title} className="card-elevated p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}20`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4" style={{ background: 'var(--surface)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold font-display mb-16" style={{ color: 'var(--text-primary)' }}>How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign up free', desc: 'Create your account and pick your MSCE subjects during a quick 6-step setup.' },
              { step: '2', title: 'Practice with real papers', desc: 'Access MSCE past papers, build exercises, and take timed weekly tests.' },
              { step: '3', title: 'Track your grade', desc: 'Watch your Grade 1–9 predictions improve as you practice more.' },
            ].map(s => (
              <div key={s.step}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold font-display mx-auto mb-4 text-white" style={{ background: '#1f3d5d' }}>
                  {s.step}
                </div>
                <h3 className="font-bold font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl p-10 text-white" style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #2d4f8a 100%)' }}>
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-3xl font-bold font-display mb-3">Ready to start preparing?</h2>
            <p className="text-white/70 mb-8">Join thousands of Form 4 students preparing for MSCE.</p>
            <button onClick={() => navigate('/auth?tab=signup')} className="btn btn-accent px-8 py-4 text-base font-bold">
              Get Started Free <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: '#e9ae34' }}>🎓</div>
          <span className="font-bold font-display text-sm" style={{ color: 'var(--text-primary)' }}>MSCE Prep</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} MSCE Prep. Built for Malawian students. Contact: wngplays@gmail.com
        </p>
      </footer>
    </div>
  )
}
