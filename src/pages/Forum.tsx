import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Plus, Pin, ChevronRight, Search, Loader2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type ForumPost } from '../lib/supabase'
import { timeAgo, cn } from '../lib/utils'
import { toast } from 'sonner'

const CATEGORIES = ['all', 'general', 'help', 'feedback', 'announcements', 'study-tips']
const CATEGORY_COLORS: Record<string, string> = {
  general: '#3b82f6', help: '#8b5cf6', feedback: '#10b981',
  announcements: '#e9ae34', 'study-tips': '#f97316', all: '#64748b'
}

export default function Forum() {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'general' })
  const [posting, setPosting] = useState(false)

  useEffect(() => { fetchPosts() }, [category])

  async function fetchPosts() {
    setLoading(true)
    let q = supabase.from('forum_posts')
      .select('*, profiles(full_name, avatar_color)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (category !== 'all') q = q.eq('category', category)
    const { data } = await q.limit(50)
    setPosts(data as ForumPost[] || [])
    setLoading(false)
  }

  const filtered = posts.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()))

  const submitPost = async () => {
    if (!profile || !newPost.title.trim() || !newPost.body.trim()) {
      toast.error('Please fill in title and message'); return
    }
    setPosting(true)
    const { error } = await supabase.from('forum_posts').insert({
      user_id: profile.user_id,
      title: newPost.title,
      body: newPost.body,
      category: newPost.category,
      reply_count: 0,
    })
    if (error) { toast.error(error.message); setPosting(false); return }
    toast.success('Post created!')
    setNewPost({ title: '', body: '', category: 'general' })
    setShowNew(false)
    fetchPosts()
    setPosting(false)
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Community</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ask questions, share tips, get updates</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn btn-accent gap-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 w-full" placeholder="Search posts..." />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all capitalize border', category === cat ? 'text-white' : '')}
            style={category === cat
              ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat], color: 'white' }
              : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>No posts yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Be the first to start a discussion!</p>
          <button onClick={() => setShowNew(true)} className="btn btn-accent">Create First Post</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => {
            const avatarColor = (post.profiles as any)?.avatar_color || '#1f3d5d'
            const name = (post.profiles as any)?.full_name || 'Student'
            return (
              <div key={post.id} className="card-elevated rounded-2xl p-4 cursor-pointer" onClick={() => navigate(`/forum/${post.id}`)}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: avatarColor, color: 'white' }}>
                    {name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.is_pinned && <Pin size={12} className="text-amber-500" />}
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                        style={{ background: `${CATEGORY_COLORS[post.category] || '#64748b'}20`, color: CATEGORY_COLORS[post.category] || '#64748b' }}>
                        {post.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm font-display mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{post.title}</h3>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{post.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{name}</span>
                      <span>·</span>
                      <span>{timeAgo(post.created_at)}</span>
                      <span>·</span>
                      <span>{post.reply_count || 0} replies</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Post Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-slide-up" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>New Post</h2>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <select value={newPost.category} onChange={e => setNewPost(f => ({ ...f, category: e.target.value }))} className="input w-full">
                {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <input value={newPost.title} onChange={e => setNewPost(f => ({ ...f, title: e.target.value }))}
                className="input w-full" placeholder="Post title..." />
              <textarea value={newPost.body} onChange={e => setNewPost(f => ({ ...f, body: e.target.value }))}
                className="input w-full resize-none" rows={4} placeholder="Write your message..." />
              <button onClick={submitPost} disabled={posting} className="btn btn-accent w-full py-3 font-bold">
                {posting ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
