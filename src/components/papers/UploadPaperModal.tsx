import React, { useState } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, type SubjectType } from '../../lib/supabase'
import { SUBJECTS } from '../../lib/utils'
import { toast } from 'sonner'

interface Props { onClose: () => void }

export default function UploadPaperModal({ onClose }: Props) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', subject: '' as SubjectType | '', year: new Date().getFullYear(),
    paper_type: 'msce_official' as 'msce_official' | 'school_paper', school_name: ''
  })
  const [file, setFile] = useState<File | null>(null)

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !file || !form.subject) { toast.error('Please fill all fields'); return }
    setLoading(true)

    // Upload file to Supabase storage
    const ext = file.name.split('.').pop()
    const path = `${profile.user_id}/${Date.now()}.${ext}`
    const { data: fileData, error: fileErr } = await supabase.storage
      .from('paper-uploads').upload(path, file)
    if (fileErr) { toast.error('Upload failed: ' + fileErr.message); setLoading(false); return }

    const { data: urlData } = supabase.storage.from('paper-uploads').getPublicUrl(path)

    const { error } = await supabase.from('paper_uploads').insert({
      user_id: profile.user_id,
      title: form.title,
      subject: form.subject,
      year: form.year,
      paper_type: form.paper_type,
      school_name: form.school_name || null,
      file_url: urlData.publicUrl,
      status: 'pending',
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Paper submitted for review! You\'ll be notified when it\'s approved.')
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slide-up" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold font-display text-lg" style={{ color: 'var(--text-primary)' }}>Upload a Paper</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Title</label>
            <input value={form.title} onChange={f('title')} className="input w-full" placeholder="e.g. Mathematics Paper II - 2023" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Subject</label>
              <select value={form.subject} onChange={f('subject')} className="input w-full" required>
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Year</label>
              <input type="number" value={form.year} onChange={f('year')} className="input w-full" min={2000} max={2025} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Type</label>
            <div className="flex gap-2">
              {(['msce_official', 'school_paper'] as const).map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, paper_type: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${form.paper_type === t ? 'text-white' : ''}`}
                  style={form.paper_type === t ? { background: '#1f3d5d', borderColor: '#1f3d5d', color: 'white' } : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {t === 'msce_official' ? 'MSCE Official' : 'School Paper'}
                </button>
              ))}
            </div>
          </div>
          {form.paper_type === 'school_paper' && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>School Name</label>
              <input value={form.school_name} onChange={f('school_name')} className="input w-full" placeholder="Optional" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>PDF File</label>
            <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-amber-400"
              style={{ borderColor: file ? '#16a34a' : 'var(--border)' }}
              onClick={() => document.getElementById('paper-file')?.click()}>
              <Upload size={24} className="mx-auto mb-2" style={{ color: file ? '#16a34a' : 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {file ? file.name : 'Click to upload PDF'}
              </p>
              <input id="paper-file" type="file" accept=".pdf" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ℹ️ Your paper will be reviewed before appearing publicly. Approved papers earn you contribution credits.
          </p>
          <button type="submit" disabled={loading || !file} className="btn btn-accent w-full py-3 font-bold">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /> Submit for Review</>}
          </button>
        </form>
      </div>
    </div>
  )
}
