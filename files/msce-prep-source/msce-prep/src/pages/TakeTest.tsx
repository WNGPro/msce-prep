import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle, X, Loader2, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Question, type SubjectType } from '../lib/supabase'
import { getSubject, formatSeconds, percentageToGrade, gradeToColor, cn } from '../lib/utils'
import { queueProgressUpdate } from '../lib/offline'
import { toast } from 'sonner'

const DURATION = 30 * 60 // 30 minutes

interface AnswerState {
  selected: string | null
  flagged: boolean
}

// Mock questions for when DB is empty
function getMockQuestions(subject: SubjectType): Question[] {
  const base: Partial<Question> = {
    subject, paper_id: null, difficulty: 2, marks: 2,
    explanation: 'Review your notes on this topic.',
    created_at: new Date().toISOString()
  }
  const topicMap: Record<string, { q: string; opts: string[]; ans: string; topic: string }[]> = {
    mathematics: [
      { q: 'Simplify: 3x² + 2x² – x²', opts: ['4x²','5x²','3x²','6x²'], ans: '4x²', topic: 'Algebra' },
      { q: 'Find the gradient of y = 4x + 7', opts: ['7','4','11','1'], ans: '4', topic: 'Algebra' },
      { q: 'What is the area of a circle with radius 7cm? (π=22/7)', opts: ['154cm²','44cm²','22cm²','308cm²'], ans: '154cm²', topic: 'Geometry' },
      { q: 'If 2x – 3 = 9, find x', opts: ['3','6','4.5','5'], ans: '6', topic: 'Algebra' },
      { q: 'Calculate 15% of 200', opts: ['30','25','35','20'], ans: '30', topic: 'Statistics' },
    ],
    biology: [
      { q: 'What is the powerhouse of the cell?', opts: ['Nucleus','Mitochondria','Ribosome','Vacuole'], ans: 'Mitochondria', topic: 'Cell Biology' },
      { q: 'Which blood type is the universal donor?', opts: ['A','B','AB','O'], ans: 'O', topic: 'Human Anatomy' },
      { q: 'Photosynthesis occurs in which organelle?', opts: ['Mitochondria','Nucleus','Chloroplast','Vacuole'], ans: 'Chloroplast', topic: 'Plant Biology' },
      { q: 'DNA stands for:', opts: ['Deoxyribonucleic Acid','Diribonucleic Acid','Deoxyribose Nucleic Acid','Dinucleic Acid'], ans: 'Deoxyribonucleic Acid', topic: 'Genetics' },
      { q: 'Which gas do plants absorb during photosynthesis?', opts: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], ans: 'Carbon Dioxide', topic: 'Plant Biology' },
    ],
    physics: [
      { q: 'What is the SI unit of force?', opts: ['Joule','Watt','Newton','Pascal'], ans: 'Newton', topic: 'Mechanics' },
      { q: 'Speed = Distance ÷ ?', opts: ['Mass','Acceleration','Time','Volume'], ans: 'Time', topic: 'Mechanics' },
      { q: 'What type of wave is sound?', opts: ['Transverse','Longitudinal','Electromagnetic','Light'], ans: 'Longitudinal', topic: 'Waves' },
      { q: 'Ohm\'s Law states: V = ?', opts: ['I/R','IR','I+R','I²R'], ans: 'IR', topic: 'Electricity' },
      { q: 'The unit of electrical resistance is:', opts: ['Volt','Ampere','Ohm','Watt'], ans: 'Ohm', topic: 'Electricity' },
    ],
  }
  const qs = topicMap[subject] || topicMap.mathematics
  return qs.map((q, i) => ({
    ...base as Question,
    id: `mock-${subject}-${i}`,
    question_text: q.q,
    options: q.opts,
    correct_answer: q.ans,
    topic: q.topic,
  }))
}

export default function TakeTest() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const subject = params.get('subject') as SubjectType | null
  const testType = (params.get('type') as 'weekly' | 'custom') || 'custom'

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    fetchQuestions()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!loading && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [loading, submitted])

  async function fetchQuestions() {
    setLoading(true)
    let q = supabase.from('questions').select('*')
    if (subject) q = q.eq('subject', subject)
    const { data } = await q.limit(10)
    if (data && data.length >= 3) {
      setQuestions(data as Question[])
    } else {
      setQuestions(getMockQuestions(subject || 'mathematics'))
    }
    setLoading(false)
  }

  const current = questions[currentIdx]
  const answerState = current ? (answers[current.id] || { selected: null, flagged: false }) : null

  const select = (opt: string) => {
    if (submitted || !current) return
    setAnswers(prev => ({ ...prev, [current.id]: { ...prev[current.id] || { flagged: false }, selected: opt } }))
  }

  const toggleFlag = () => {
    if (!current) return
    setAnswers(prev => ({ ...prev, [current.id]: { ...prev[current.id] || { selected: null }, flagged: !prev[current.id]?.flagged } }))
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting || submitted) return
    const answeredCount = Object.values(answers).filter(a => a.selected !== null).length
    if (!autoSubmit && answeredCount < questions.length * 0.5) {
      if (!window.confirm(`You've only answered ${answeredCount}/${questions.length} questions. Submit anyway?`)) return
    }
    setSubmitting(true)
    clearInterval(timerRef.current)

    let correct = 0
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0)
    let earned = 0
    const weakTopics: string[] = []

    questions.forEach(q => {
      const sel = answers[q.id]?.selected
      if (sel === q.correct_answer) { earned += q.marks; correct++ }
      else if (q.topic) weakTopics.push(q.topic)
    })

    setScore(earned)
    setSubmitted(true)

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
    const resultData = {
      user_id: profile?.user_id,
      test_type: testType,
      subject: subject || null,
      score: earned,
      total_marks: totalMarks,
      questions_attempted: questions.map(q => q.id),
      weak_topics: [...new Set(weakTopics)],
      time_taken_seconds: timeTaken,
      completed_at: new Date().toISOString()
    }

    if (navigator.onLine && profile) {
      const { error } = await supabase.from('test_results').insert(resultData)
      if (error) await queueProgressUpdate(resultData)
    } else {
      await queueProgressUpdate(resultData)
      toast.info('Result saved offline — will sync when you reconnect')
    }

    setSubmitting(false)
  }, [answers, questions, profile, subject, testType, submitting, submitted])

  const timerColor = timeLeft > 300 ? '#16a34a' : timeLeft > 60 ? '#d97706' : '#dc2626'
  const timerPulse = timeLeft <= 60 && !submitted

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin mx-auto mb-3 text-amber-500" />
        <p style={{ color: 'var(--text-muted)' }}>Preparing your test...</p>
      </div>
    </div>
  )

  if (submitting) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin mx-auto mb-3 text-amber-500" />
        <p className="font-semibold font-display" style={{ color: 'var(--text-primary)' }}>Grading your answers...</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Calculating MSCE grade prediction</p>
      </div>
    </div>
  )

  // Results screen
  if (submitted) {
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0)
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
    const grade = percentageToGrade(pct)
    const trophyEmoji = pct >= 70 ? '🏆' : pct >= 50 ? '🎯' : '📚'

    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{trophyEmoji}</div>
          <h1 className="text-3xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
            {pct}%
          </h1>
          <div className={`text-5xl font-bold font-display mb-1 ${gradeToColor(grade)}`}>Grade {grade}</div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {score}/{totalMarks} marks · {formatSeconds(DURATION - timeLeft)} taken
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold font-display text-green-500">{Object.values(answers).filter(a => a.selected !== null && questions.find(q => q.id === Object.keys(answers).find(k => answers[k] === a))?.correct_answer === a.selected).length}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Correct</div>
          </div>
          <div className="card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{questions.length}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Questions</div>
          </div>
          <div className="card rounded-2xl p-4 text-center">
            <div className={`text-2xl font-bold font-display ${gradeToColor(grade)}`}>{grade}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>MSCE Grade</div>
          </div>
        </div>

        {/* Answer Review */}
        <div className="space-y-3 mb-6">
          <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Answer Review</h2>
          {questions.map((q, i) => {
            const sel = answers[q.id]?.selected
            const correct = q.correct_answer
            const isCorrect = sel === correct
            const subj = getSubject(q.subject)
            return (
              <div key={q.id} className="card rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isCorrect ? <CheckCircle size={15} /> : <X size={15} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{subj.emoji}</span>
                      {q.topic && <span className="badge badge-muted text-xs">{q.topic}</span>}
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{q.question_text}</p>
                  </div>
                </div>
                <div className="space-y-1.5 ml-10">
                  {q.options.map(opt => (
                    <div key={opt}
                      className={cn('text-xs px-3 py-2 rounded-xl',
                        opt === correct ? 'font-semibold' : '',
                        opt === sel && !isCorrect ? 'line-through opacity-60' : ''
                      )}
                      style={{
                        background: opt === correct ? 'rgba(22,163,74,0.1)' : opt === sel && !isCorrect ? 'rgba(220,38,38,0.1)' : 'var(--surface-2)',
                        color: opt === correct ? '#16a34a' : opt === sel && !isCorrect ? '#dc2626' : 'var(--text-secondary)'
                      }}>
                      {opt === correct && '✓ '}{opt}
                    </div>
                  ))}
                  {q.explanation && (
                    <p className="text-xs mt-2 px-3 py-2 rounded-xl italic" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/tests')} className="btn btn-outline flex-1 py-3">Back to Tests</button>
          <button onClick={() => navigate('/progress')} className="btn btn-accent flex-1 py-3 font-bold">View Progress</button>
        </div>
      </div>
    )
  }

  // Exam interface
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => { if (window.confirm('Exit test? Progress will be lost.')) navigate('/tests') }}
          className="p-2 rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-secondary)' }}>
          <X size={18} />
        </button>
        <div className="flex-1">
          <div className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>
            {subject ? getSubject(subject).label : 'Weekly Test'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {Object.values(answers).filter(a => a.selected).length}/{questions.length} answered
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold font-display text-sm', timerPulse && 'animate-pulse')}
          style={{ background: `${timerColor}15`, color: timerColor }}>
          <Clock size={14} /> {formatSeconds(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 flex-shrink-0" style={{ background: 'var(--border)' }}>
        <div className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Question navigator */}
          <div className="flex flex-wrap gap-2 mb-6">
            {questions.map((q, i) => {
              const a = answers[q.id]
              return (
                <button key={q.id} onClick={() => setCurrentIdx(i)}
                  className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-all',
                    i === currentIdx ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                  )}
                  style={{
                    background: a?.selected ? '#16a34a' : a?.flagged ? '#d97706' : 'var(--surface-2)',
                    color: a?.selected ? 'white' : a?.flagged ? 'white' : 'var(--text-muted)'
                  }}>
                  {i + 1}
                </button>
              )
            })}
          </div>

          {current && (
            <div className="animate-fade-in">
              {/* Question header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{getSubject(current.subject).emoji}</span>
                {current.topic && <span className="badge badge-muted">{current.topic}</span>}
                <span className="badge badge-accent ml-auto">{current.marks} mark{current.marks !== 1 ? 's' : ''}</span>
              </div>

              <h2 className="text-lg font-semibold font-display mb-6" style={{ color: 'var(--text-primary)' }}>
                Q{currentIdx + 1}. {current.question_text}
              </h2>

              <div className="space-y-3">
                {current.options.map((opt, i) => {
                  const isSelected = answerState?.selected === opt
                  return (
                    <button key={opt} onClick={() => select(opt)}
                      className={cn('w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all')}
                      style={{
                        borderColor: isSelected ? '#1f3d5d' : 'var(--border)',
                        background: isSelected ? 'rgba(31,61,93,0.06)' : 'var(--surface)',
                        color: 'var(--text-primary)'
                      }}>
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all')}
                        style={{
                          background: isSelected ? '#1f3d5d' : 'var(--surface-2)',
                          color: isSelected ? '#e9ae34' : 'var(--text-muted)'
                        }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-sm leading-relaxed">{opt}</span>
                      {isSelected && <CheckCircle size={16} className="ml-auto text-green-500 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 p-4 border-t flex-shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="btn btn-outline px-4 py-2.5">
          <ChevronLeft size={16} />
        </button>
        <button onClick={toggleFlag}
          className={cn('btn px-4 py-2.5 gap-1.5 text-sm', answerState?.flagged ? 'btn-accent' : 'btn-outline')}>
          <Flag size={14} /> {answerState?.flagged ? 'Flagged' : 'Flag'}
        </button>
        {currentIdx === questions.length - 1 ? (
          <button onClick={() => handleSubmit(false)} className="btn btn-accent flex-1 py-2.5 font-bold gap-2">
            <CheckCircle size={16} /> Submit Test
          </button>
        ) : (
          <button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} className="btn btn-primary flex-1 py-2.5 gap-1.5">
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
