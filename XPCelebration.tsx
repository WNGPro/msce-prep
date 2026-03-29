import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Trophy, Flame, Star } from 'lucide-react'
import { xpToLevel, xpToNextLevel, levelTitle } from '../lib/useXP'

interface XPCelebrationProps {
  xpEarned: number
  totalXP: number
  streak: number
  score: number
  totalMarks: number
  subject?: string
  onDismiss: () => void
}

function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute w-2 h-2 rounded-full pointer-events-none" style={style} />
}

export default function XPCelebration({ xpEarned, totalXP, streak, score, totalMarks, subject, onDismiss }: XPCelebrationProps) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [xpAnimated, setXpAnimated] = useState(0)
  const [barAnimated, setBarAnimated] = useState(false)
  const prevXP = totalXP - xpEarned

  const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
  const prevLevel = xpToLevel(prevXP)
  const newLevel = xpToLevel(totalXP)
  const leveledUp = newLevel > prevLevel
  const { current: xpCurrent, needed: xpNeeded, percent: xpPercent } = xpToNextLevel(totalXP)
  const prevPercent = xpToNextLevel(prevXP).percent

  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : pct >= 40 ? '📚' : '💪'
  const message = pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Great work!' : pct >= 40 ? 'Keep going!' : 'Don\'t give up!'

  // Random particles
  const particles = Array.from({ length: 18 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    background: ['#e9ae34','#16a34a','#3b82f6','#ef4444','#8b5cf6'][i % 5],
    transform: `scale(${0.5 + Math.random()})`,
    animation: `float ${1.5 + Math.random() * 2}s ${Math.random() * 0.5}s ease-out forwards`,
    opacity: 0,
  }))

  useEffect(() => {
    // Stagger in
    setTimeout(() => setVisible(true), 50)
    // Animate XP counter
    let start = 0
    const step = Math.ceil(xpEarned / 30)
    const interval = setInterval(() => {
      start += step
      if (start >= xpEarned) { setXpAnimated(xpEarned); clearInterval(interval) }
      else setXpAnimated(start)
    }, 30)
    // Animate bar
    setTimeout(() => setBarAnimated(true), 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,26,38,0.92)', backdropFilter: 'blur(8px)' }}>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm transition-all duration-500"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(40px)',
          opacity: visible ? 1 : 0,
        }}>
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>

          {/* Top — score */}
          <div className="px-6 pt-8 pb-6 text-center"
            style={{ background: 'linear-gradient(135deg, #1f3d5d 0%, #0d2238 100%)' }}>
            <div className="text-6xl mb-2">{emoji}</div>
            <h2 className="text-2xl font-bold font-display text-white mb-1">{message}</h2>
            <p className="text-white/60 text-sm mb-4">
              {subject ? `${subject} · ` : ''}{score}/{totalMarks} marks · {pct}%
            </p>

            {/* Score bar */}
            <div className="h-3 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: pct >= 75 ? '#16a34a' : pct >= 50 ? '#e9ae34' : '#ef4444',
                  transitionDelay: '200ms'
                }} />
            </div>
          </div>

          {/* XP earned */}
          <div className="px-6 py-5">

            {/* Level up banner */}
            {leveledUp && (
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-4 animate-scale-in"
                style={{ background: 'rgba(233,174,52,0.15)', border: '1.5px solid rgba(233,174,52,0.4)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                  {newLevel}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#e9ae34' }}>Level Up! 🎉</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    You are now a <strong>{levelTitle(newLevel)}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* XP gained */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star size={16} style={{ color: '#e9ae34' }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>XP Earned</span>
              </div>
              <span className="font-bold text-xl" style={{ color: '#e9ae34' }}>
                +{xpAnimated}
              </span>
            </div>

            {/* XP progress bar */}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Level {newLevel}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{xpCurrent}/{xpNeeded} XP</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden mb-5" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${barAnimated ? xpPercent : prevPercent}%`,
                  background: 'linear-gradient(90deg, #e9ae34, #f5c842)',
                  transitionDelay: '600ms'
                }} />
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-2xl mb-5"
                style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
                <Flame size={18} style={{ color: '#e9ae34' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    🔥 {streak} day streak
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Keep it up — come back tomorrow!
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onDismiss}
                className="py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                Review Answers
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#e9ae34', color: '#1f3d5d' }}>
                Dashboard <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
