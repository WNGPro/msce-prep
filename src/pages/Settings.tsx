import React, { useState } from 'react'
import { Sun, Moon, Monitor, Bell, BellOff, Wifi, WifiOff, Shield, HelpCircle, LogOut, ChevronRight, Star, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

export default function Settings() {
  const { profile, signOut, isAdmin } = useAuth()
  const { theme, setTheme, dataSaver, setDataSaver } = useTheme()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(() => localStorage.getItem('msce-notifs') !== 'false')
  const [helpVisible, setHelpVisible] = useState(() => localStorage.getItem('msce-help-hidden') !== 'true')
  const [helpQuestion, setHelpQuestion] = useState('')
  const [sendingHelp, setSendingHelp] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  const toggleNotifs = () => {
    const next = !notifs
    setNotifs(next)
    localStorage.setItem('msce-notifs', String(next))
    if (next && 'Notification' in window) Notification.requestPermission()
  }

  const toggleHelp = () => {
    const next = !helpVisible
    setHelpVisible(next)
    localStorage.setItem('msce-help-hidden', next ? 'false' : 'true')
  }

  const submitHelpQuestion = async () => {
    if (!helpQuestion.trim() || !profile) return
    setSendingHelp(true)
    await supabase.from('forum_posts').insert({
      user_id: profile.user_id,
      title: `[Help] ${helpQuestion.slice(0, 60)}`,
      body: helpQuestion,
      category: 'help',
    })
    setHelpQuestion('')
    toast.success('Question submitted! Check the Community forum for an answer.')
    setSendingHelp(false)
  }

  const changePassword = async () => {
    if (passwordForm.next !== passwordForm.confirm) { toast.error('Passwords do not match'); return }
    if (passwordForm.next.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next })
    if (error) toast.error(error.message)
    else { toast.success('Password updated!'); setPasswordForm({ current: '', next: '', confirm: '' }) }
    setChangingPassword(false)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{title}</h2>
      <div className="card rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
        {children}
      </div>
    </div>
  )

  const Row = ({ icon, label, children, onClick }: { icon: React.ReactNode; label: string; children?: React.ReactNode; onClick?: () => void }) => (
    <div className={cn('flex items-center gap-3 px-4 py-4', onClick && 'cursor-pointer hover:bg-[var(--surface-2)] transition-colors')} onClick={onClick}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
      {children}
    </div>
  )

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={cn('w-12 h-6 rounded-full transition-all relative', value ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600')}>
      <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all', value ? 'left-6' : 'left-0.5')} />
    </button>
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold font-display mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      <Section title="Appearance">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              <Sun size={16} />
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Theme</span>
          </div>
          <div className="flex gap-2 ml-11">
            {([['light', <Sun size={14}/>, 'Light'], ['dark', <Moon size={14}/>, 'Dark'], ['system', <Monitor size={14}/>, 'System']] as const).map(([val, icon, label]) => (
              <button key={val} onClick={() => setTheme(val)}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border', theme === val ? 'text-white' : '')}
                style={theme === val ? { background: '#1f3d5d', borderColor: '#1f3d5d', color: 'white' } : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
        <Row icon={<WifiOff size={16} />} label="Data Saver Mode">
          <Toggle value={dataSaver} onChange={() => setDataSaver(!dataSaver)} />
        </Row>
      </Section>

      <Section title="Notifications">
        <Row icon={notifs ? <Bell size={16} /> : <BellOff size={16} />} label="Push Notifications">
          <Toggle value={notifs} onChange={toggleNotifs} />
        </Row>
        <Row icon={<HelpCircle size={16} />} label="Show Help Bubble">
          <Toggle value={helpVisible} onChange={toggleHelp} />
        </Row>
      </Section>

      <Section title="Help & Support">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              <HelpCircle size={16} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ask a question</span>
          </div>
          <div className="ml-11 space-y-2">
            <textarea value={helpQuestion} onChange={e => setHelpQuestion(e.target.value)}
              className="input w-full resize-none text-sm" rows={3}
              placeholder="Ask anything about the platform or your MSCE preparation..." />
            <button onClick={submitHelpQuestion} disabled={sendingHelp || !helpQuestion.trim()} className="btn btn-accent text-sm py-2 px-4">
              {sendingHelp ? <Loader2 size={14} className="animate-spin" /> : 'Submit Question'}
            </button>
          </div>
        </div>
        <Row icon={<ChevronRight size={16} />} label="Visit Community Forum" onClick={() => navigate('/forum')} >
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </Row>
      </Section>

      <Section title="Account Security">
        <div className="px-4 py-4">
          <p className="text-xs mb-3 ml-11" style={{ color: 'var(--text-muted)' }}>Change your password</p>
          <div className="ml-11 space-y-2">
            <input type="password" value={passwordForm.next} onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))} className="input w-full" placeholder="New password" />
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} className="input w-full" placeholder="Confirm new password" />
            <button onClick={changePassword} disabled={changingPassword} className="btn btn-primary text-sm py-2 px-4">
              {changingPassword ? <Loader2 size={14} className="animate-spin" /> : 'Change Password'}
            </button>
          </div>
        </div>
      </Section>

      {!profile?.is_premium && (
        <Section title="Premium">
          <Row icon={<Star size={16} className="text-amber-500" />} label="Upgrade to Premium" onClick={() => navigate('/premium')}>
            <span className="text-xs font-bold text-amber-500 mr-2">Unlock AI</span>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </Row>
        </Section>
      )}

      {isAdmin && (
        <Section title="Administration">
          <Row icon={<Shield size={16} />} label="Admin Panel" onClick={() => navigate('/admin')}>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </Row>
        </Section>
      )}

      <Section title="Account">
        <Row icon={<LogOut size={16} />} label="Sign Out" onClick={signOut}>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </Row>
      </Section>

      <p className="text-xs text-center mt-4 pb-4" style={{ color: 'var(--text-muted)' }}>
        MSCE Prep v1.0.0 · Built for Malawian students · Contact: wngplays@gmail.com
      </p>
    </div>
  )
}
