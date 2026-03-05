import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, X, Save, Loader2 } from 'lucide-react'
import { supabase, type Paper, type SubjectType } from '../../lib/supabase'
import { SUBJECTS, getSubject, formatDate } from '../../lib/utils'
import { toast } from 'sonner'

const emptyForm = { title: '', subject: '' as SubjectType | '', year: 2024, paper_type: 'msce_official' as 'msce_official' | 'school_paper', file_url: '', description: '', topics: '', is_published: true }

export default function AdminPapers() {
  const navigate = useNavigate()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Paper | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPapers() }, [])

  async function fetchPapers() {
    const { data } = await supabase.from('papers').select('*').order('year', { ascending: false })
    setPapers(data as Paper[] || [])
    setLoading(false)
  }

  const openEdit = (p: Paper) => {
    setEditing(p)
    setForm({ title: p.title, subject: p.subject, year: p.year, paper_type: p.paper_type, file_url: p.file_url || '', description: p.description || '', topics: p.topics?.join(', ') || '', is_published: p.is_published })
    setShowForm(true)
  }

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  const save = async () => {
    if (!form.title || !form.subject) { toast.error('Title and subject required'); return }
    setSaving(true)
    const payload = { title: form.title, subject: form.subject, year: form.year, paper_type: form.paper_type, file_url: form.file_url || null, description: form.description || null, topics: form.topics.split(',').map(t => t.trim()).filter(Boolean), is_published: form.is_published }
    if (editing) {
      const { error } = await supabase.from('papers').update(payload).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Paper updated!')
    } else {
      const { error } = await supabase.from('papers').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Paper added!')
    }
    setShowForm(false); fetchPapers(); setSaving(false)
  }

  const togglePublish = async (p: Paper) => {
    await supabase.from('papers').update({ is_published: !p.is_published }).eq('id', p.id)
    fetchPapers()
    toast.success(p.is_published ? 'Paper unpublished' : 'Paper published')
  }

  const deletePaper = async (id: string) => {
    if (!window.confirm('Delete this paper?')) return
    await supabase.from('papers').delete().eq('id', id)
    fetchPapers(); toast.success('Deleted')
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="border-b px-4 py-3 flex items-center gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Manage Papers</h1>
        <button onClick={openNew} className="btn btn-accent ml-auto gap-2 text-sm"><Plus size={14} /> Add Paper</button>
      </div>

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Title</th>
                  <th className="text-left p-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Subject</th>
                  <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Year</th>
                  <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {papers.map(p => {
                  const s = getSubject(p.subject)
                  return (
                    <tr key={p.id} className="border-t hover:bg-[var(--surface-2)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-3 font-medium truncate max-w-48" style={{ color: 'var(--text-primary)' }}>{p.title}</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="flex items-center gap-1.5 text-xs"><span>{s.emoji}</span>{s.label}</span>
                      </td>
                      <td className="p-3 text-center" style={{ color: 'var(--text-muted)' }}>{p.year}</td>
                      <td className="p-3 text-center">
                        <span className={`badge ${p.is_published ? 'badge-success' : 'badge-muted'}`}>
                          {p.is_published ? 'Live' : 'Hidden'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => togglePublish(p)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }} title={p.is_published ? 'Unpublish' : 'Publish'}>
                            {p.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deletePaper(p.id)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>{editing ? 'Edit Paper' : 'Add Paper'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <input value={form.title} onChange={f('title')} className="input w-full" placeholder="Title" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.subject} onChange={f('subject')} className="input">
                  <option value="">Subject</option>
                  {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                </select>
                <input type="number" value={form.year} onChange={f('year')} className="input" min={2000} max={2030} />
              </div>
              <select value={form.paper_type} onChange={f('paper_type')} className="input w-full">
                <option value="msce_official">MSCE Official</option>
                <option value="school_paper">School Paper</option>
              </select>
              <input value={form.file_url} onChange={f('file_url')} className="input w-full" placeholder="Google Drive URL (optional)" />
              <input value={form.topics} onChange={f('topics')} className="input w-full" placeholder="Topics (comma-separated)" />
              <textarea value={form.description} onChange={f('description')} className="input w-full resize-none" rows={2} placeholder="Description (optional)" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={f('is_published')} className="w-4 h-4 rounded" />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Published (visible to students)</span>
              </label>
              <button onClick={save} disabled={saving} className="btn btn-accent w-full py-3 font-bold">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Paper</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
