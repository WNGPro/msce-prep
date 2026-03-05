import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Users, BookOpen, CheckCircle, Clock, ChevronRight, ArrowLeft, School } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { timeAgo } from '../../lib/utils'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ users: 0, papers: 0, pendingUploads: 0, questions: 0 })
  const [pendingUploads, setPendingUploads] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [
      { count: users },
      { count: papers },
      { count: pendingUploads },
      { count: questions },
      { data: pending },
      { data: users_ }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('papers').select('*', { count: 'exact', head: true }),
      supabase.from('paper_uploads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('paper_uploads').select('*, profiles(full_name)').eq('status', 'pending').limit(5),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
    ])
    setStats({ users: users || 0, papers: papers || 0, pendingUploads: pendingUploads || 0, questions: questions || 0 })
    setPendingUploads(pending || [])
    setRecentUsers(users_ || [])
    setLoading(false)
  }

  const approveUpload = async (id: string) => {
    await supabase.from('paper_uploads').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  const rejectUpload = async (id: string) => {
    const reason = window.prompt('Reason for rejection:')
    if (reason === null) return
    await supabase.from('paper_uploads').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  const NAV_ITEMS = [
    { label: 'Papers', icon: <FileText size={16} />, to: '/admin/papers' },
    { label: 'Users', icon: <Users size={16} />, to: '/admin/users' },
    { label: 'Content', icon: <BookOpen size={16} />, to: '/admin/content' },
    { label: 'Schools', icon: <School size={16} />, to: '/admin/schools' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Admin header */}
      <div className="border-b px-4 py-3 flex items-center gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e9ae34' }}>🎓</div>
          <span className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Admin Panel</span>
        </div>
        <div className="flex gap-2 ml-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.to} onClick={() => navigate(item.to)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold font-display mb-6" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users, icon: '👥', color: '#3b82f6' },
            { label: 'Papers', value: stats.papers, icon: '📄', color: '#10b981' },
            { label: 'Questions', value: stats.questions, icon: '❓', color: '#8b5cf6' },
            { label: 'Pending Reviews', value: stats.pendingUploads, icon: '⏳', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card rounded-2xl p-4">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold font-display" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Uploads */}
          <div className="card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Pending Paper Uploads</h2>
              <span className="badge badge-accent">{stats.pendingUploads}</span>
            </div>
            {pendingUploads.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No pending uploads</p>
            ) : pendingUploads.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    by {(u.profiles as any)?.full_name || 'Unknown'} · {timeAgo(u.created_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveUpload(u.id)} className="btn btn-primary py-1.5 px-3 text-xs gap-1">
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => rejectUpload(u.id)} className="btn btn-outline py-1.5 px-3 text-xs text-red-500 border-red-300">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Users */}
          <div className="card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Recent Users</h2>
              <button onClick={() => navigate('/admin/users')} className="text-xs flex items-center gap-1" style={{ color: '#e9ae34' }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: u.avatar_color || '#1f3d5d', color: 'white' }}>
                  {(u.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.full_name || 'Student'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.school_name || 'No school'} · {timeAgo(u.created_at)}</div>
                </div>
                {u.is_premium && <span className="badge badge-accent text-xs">Premium</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
