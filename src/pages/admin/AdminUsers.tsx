import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, ShieldOff, Search, Star, StarOff } from 'lucide-react'
import { supabase, type Profile } from '../../lib/supabase'
import { formatDate, getSubject } from '../../lib/utils'
import { toast } from 'sonner'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Profile | null>(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data as Profile[] || [])
    setLoading(false)
  }

  const togglePremium = async (u: Profile) => {
    await supabase.from('profiles').update({ is_premium: !u.is_premium }).eq('user_id', u.user_id)
    toast.success(u.is_premium ? 'Premium removed' : 'Premium granted')
    fetchUsers()
    setSelected(s => s ? { ...s, is_premium: !s.is_premium } : s)
  }

  const filtered = users.filter(u =>
    !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.school_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="border-b px-4 py-3 flex items-center gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>All Users</h1>
        <span className="ml-2 badge badge-muted">{users.length}</span>
      </div>

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 w-full" placeholder="Search by name, email or school..." />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>User</th>
                  <th className="text-left p-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>School</th>
                  <th className="text-left p-3 text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Joined</th>
                  <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Subjects</th>
                  <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Premium</th>
                  <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t hover:bg-[var(--surface-2)] cursor-pointer transition-colors" style={{ borderColor: 'var(--border)' }}
                    onClick={() => setSelected(selected?.id === u.id ? null : u)}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                          style={{ background: u.avatar_color || '#1f3d5d', color: 'white' }}>
                          {(u.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium truncate max-w-32" style={{ color: 'var(--text-primary)' }}>{u.full_name || 'Unknown'}</div>
                          <div className="text-xs truncate max-w-32" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs hidden md:table-cell truncate max-w-32" style={{ color: 'var(--text-muted)' }}>{u.school_name || '—'}</td>
                    <td className="p-3 text-xs hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>{formatDate(u.created_at)}</td>
                    <td className="p-3 text-center text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.subjects?.length || 0}</td>
                    <td className="p-3 text-center">
                      <span className={`badge ${u.is_premium ? 'badge-accent' : 'badge-muted'}`}>{u.is_premium ? '⭐ Yes' : 'No'}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={e => { e.stopPropagation(); togglePremium(u) }}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                        style={{ color: u.is_premium ? '#d97706' : 'var(--text-muted)' }}
                        title={u.is_premium ? 'Remove premium' : 'Grant premium'}>
                        {u.is_premium ? <StarOff size={14} /> : <Star size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded user detail */}
        {selected && (
          <div className="mt-4 card rounded-2xl p-5 animate-slide-up">
            <h3 className="font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>
              {selected.full_name}'s Profile
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</div>
                <div style={{ color: 'var(--text-primary)' }}>{selected.email || '—'}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>School</div>
                <div style={{ color: 'var(--text-primary)' }}>{selected.school_name || '—'}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Test Day</div>
                <div className="capitalize" style={{ color: 'var(--text-primary)' }}>{selected.preferred_test_day}</div>
              </div>
              <div className="col-span-full">
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Subjects ({selected.subjects?.length || 0})</div>
                <div className="flex flex-wrap gap-1">
                  {(selected.subjects || []).map(sv => {
                    const s = getSubject(sv)
                    return (
                      <span key={sv} className="badge badge-muted">{s.emoji} {s.label}</span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
