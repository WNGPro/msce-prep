import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type ForumPost, type ForumReply } from '../lib/supabase'
import { timeAgo, cn } from '../lib/utils'
import { toast } from 'sonner'

export default function ForumPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, isAdmin } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { fetchPost() }, [id])

  async function fetchPost() {
    if (!id) return
    const [{ data: postData }, { data: replyData }] = await Promise.all([
      supabase.from('forum_posts').select('*, profiles(full_name, avatar_color)').eq('id', id).single(),
      supabase.from('forum_replies').select('*, profiles(full_name, avatar_color)').eq('post_id', id).order('created_at')
    ])
    setPost(postData as ForumPost)
    setReplies(replyData as ForumReply[] || [])
    setLoading(false)
  }

  const sendReply = async () => {
    if (!profile || !reply.trim() || !id) return
    setSending(true)
    const { error } = await supabase.from('forum_replies').insert({
      post_id: id, user_id: profile.user_id, body: reply, is_admin_reply: isAdmin
    })
    if (error) { toast.error(error.message); setSending(false); return }
    await supabase.from('forum_posts').update({ reply_count: (post?.reply_count || 0) + 1 }).eq('id', id)
    setReply('')
    fetchPost()
    setSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-amber-500" />
    </div>
  )
  if (!post) return (
    <div className="p-6 text-center">
      <p style={{ color: 'var(--text-muted)' }}>Post not found.</p>
      <button onClick={() => navigate('/forum')} className="btn btn-primary mt-4">Back to Forum</button>
    </div>
  )

  const postAuthor = (post.profiles as any)
  const CATEGORY_COLORS: Record<string, string> = {
    general: '#3b82f6', help: '#8b5cf6', feedback: '#10b981',
    announcements: '#e9ae34', 'study-tips': '#f97316'
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/forum')} className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to Community
      </button>

      {/* Post */}
      <div className="card rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style={{ background: postAuthor?.avatar_color || '#1f3d5d', color: 'white' }}>
            {(postAuthor?.full_name || 'S')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{postAuthor?.full_name || 'Student'}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.created_at)}</div>
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full capitalize font-medium"
            style={{ background: `${CATEGORY_COLORS[post.category] || '#64748b'}20`, color: CATEGORY_COLORS[post.category] || '#64748b' }}>
            {post.category}
          </span>
        </div>
        <h1 className="font-bold font-display text-xl mb-3" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
      </div>

      {/* Replies */}
      <div className="space-y-3 mb-6">
        <h2 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>{replies.length} Replies</h2>
        {replies.map(r => {
          const author = (r.profiles as any)
          return (
            <div key={r.id} className={cn('rounded-2xl p-4', r.is_admin_reply ? 'border-2' : 'card')}
              style={r.is_admin_reply ? { borderColor: '#e9ae34', background: 'rgba(233,174,52,0.04)' } : {}}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: author?.avatar_color || '#1f3d5d', color: 'white' }}>
                  {(author?.full_name || 'S')[0].toUpperCase()}
                </div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {author?.full_name || 'Student'}
                </div>
                {r.is_admin_reply && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(233,174,52,0.2)', color: '#92600a' }}>
                    <Shield size={10} /> Team
                  </div>
                )}
                <div className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</div>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.body}</p>
            </div>
          )
        })}
      </div>

      {/* Reply input */}
      <div className="card rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Write a Reply</h3>
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          className="input w-full resize-none mb-3" rows={3} placeholder="Share your thoughts or answer..." />
        <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn btn-accent gap-2">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Reply
        </button>
      </div>
    </div>
  )
}
