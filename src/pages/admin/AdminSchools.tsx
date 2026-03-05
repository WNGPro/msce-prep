import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Check, X, School, Edit2, Plus, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

interface SchoolEntry {
  id: string
  name: string
  location: string | null
  logo_emoji: string | null
  is_approved: boolean
  student_count: number
  created_at: string
}

export default function AdminSchools() {
  const navigate = useNavigate()
  const [schools, setSchools] = useState<SchoolEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editSchool, setEditSchool] = useState<SchoolEntry | null>(null)
  const [form, setForm] = useState({ name: '', location: '', logo_emoji: '🏫', is_approved: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSchools() }, [])

  async function fetchSchools() {
    setLoading(true)
    // Get unique schools from profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('school_name')
      .not('school_name', 'is', null)

    // Get school table if it exists
    let schoolData = null
    try {
      const { data } = await supabase.from('schools').select('*').order('name')
      schoolData = data
    } catch (_) { schoolData = null }

    if (schoolData) {
      // Count students per school
      const counts: Record<string, number> = {}
      profiles?.forEach(p => {
        if (p.school_name) counts[p.school_name] = (counts[p.school_name] || 0) + 1
      })
      const enriched = schoolData.map((s: any) => ({
        ...s,
        student_count: counts[s.name] || 0
      }))
      setSchools(enriched)
    } else {
      // Build from profiles if no schools table
      const schoolMap: Record<string, number> = {}
      profiles?.forEach(p => {
        if (p.school_name) schoolMap[p.school_name] = (schoolMap[p.school_name] || 0) + 1
      })
      const derived: SchoolEntry[] = Object.entries(schoolMap).map(([name, count], i) => ({
        id: `derived-${i}`,
        name,
        location: null,
        logo_emoji: '🏫',
        is_approved: true,
        student_count: count,
        created_at: new Date().toISOString()
      }))
      setSchools(derived.sort((a, b) => b.student_count - a.student_count))
    }
    setLoading(false)
  }

  const saveSchool = async () => {
    if (!form.name.trim()) { toast.error('School name required'); return }
    setSaving(true)
    if (editSchool && !editSchool.id.startsWith('derived-')) {
      await supabase.from('schools').update({
        name: form.name, location: form.location || null,
        logo_emoji: form.logo_emoji, is_approved: form.is_approved
      }).eq('id', editSchool.id)
      toast.success('School updated!')
    } else {
      await supabase.from('schools').insert({
        name: form.name, location: form.location || null,
        logo_emoji: form.logo_emoji, is_approved: form.is_approved
      })
      toast.success('School added!')
    }
    setShowNew(false); setEditSchool(null)
    fetchSchools(); setSaving(false)
  }

  const openEdit = (s: SchoolEntry) => {
    setEditSchool(s)
    setForm({ name: s.name, location: s.location || '', logo_emoji: s.logo_emoji || '🏫', is_approved: s.is_approved })
    setShowNew(true)
  }

  const filtered = schools.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))

  const EMOJI_OPTIONS = ['🏫', '🏛️', '📚', '🎓', '🌟', '⭐', '🦁', '🐘', '🦅', '🌍', '🇲🇼', '🔵', '🟡', '🟢', '🔴']

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Schools</h1>
        <span className="badge badge-muted ml-1">{schools.length}</span>
        <button onClick={() => { setEditSchool(null); setForm({ name: '', location: '', logo_emoji: '🏫', is_approved: true }); setShowNew(true) }}
          className="btn btn-accent ml-auto gap-2 text-sm py-2 px-3">
          <Plus size={14} /> Add School
        </button>
      </div>

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 w-full"
            placeholder="Search schools..." />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'var(--surface-2)' }}>
                  {s.logo_emoji || '🏫'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-display text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.location && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {s.location}</span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      👤 {s.student_count} student{s.student_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('badge text-xs', s.is_approved ? 'badge-success' : 'badge-error')}>
                    {s.is_approved ? '✓ Active' : '✗ Denied'}
                  </span>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--text-muted)' }}>
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="card rounded-2xl p-12 text-center">
                <School size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No schools found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* School Form Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
            style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {editSchool ? 'Edit School' : 'Add School'}
              </h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-xl hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>School Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input w-full" placeholder="e.g. Henry Henderson School of Excellence" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Location (optional)</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="input w-full" placeholder="e.g. Blantyre, Malawi" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>School Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button key={emoji} onClick={() => setForm(f => ({ ...f, logo_emoji: emoji }))}
                      className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border-2',
                        form.logo_emoji === emoji ? 'border-amber-400 scale-110' : 'border-transparent')}
                      style={{ background: 'var(--surface-2)' }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={cn('w-11 h-6 rounded-full transition-all relative', form.is_approved ? 'bg-green-500' : 'bg-gray-300')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all', form.is_approved ? 'left-5' : 'left-0.5')} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {form.is_approved ? 'Approved (visible in search)' : 'Denied (hidden from search)'}
                </span>
              </label>
              <button onClick={saveSchool} disabled={saving} className="btn btn-accent w-full py-3 font-bold">
                {saving ? <Loader2 size={16} className="animate-spin" /> : `${editSchool ? 'Update' : 'Add'} School`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
