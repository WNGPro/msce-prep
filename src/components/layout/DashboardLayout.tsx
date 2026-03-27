import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Sparkles, GraduationCap, BarChart3,
  Trophy, User, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Shield, MessageSquare, Star, BookOpen
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import HelpBubble from '../HelpBubble'
import PWAInstallPrompt from '../PWAInstallPrompt'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/papers', icon: FileText, label: 'Library' },
  { to: '/create', icon: Sparkles, label: 'Create' },
  { to: '/tests', icon: GraduationCap, label: 'Tests' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
]

const BOTTOM_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/papers', icon: BookOpen, label: 'Papers' },
  { to: '/create', icon: Sparkles, label: 'Create' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
]

export default function DashboardLayout() {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('msce-sidebar') === 'collapsed'
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('msce-sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const avatarInitial = profile?.full_name?.[0]?.toUpperCase() || 'U'
  const avatarColor = profile?.avatar_color || '#1f3d5d'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-white/10', collapsed && 'justify-center')}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-800 font-bold text-base flex-shrink-0" style={{ background: '#e9ae34' }}>
          🎓
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-sm font-display">MSCE Prep</div>
            <div className="text-white/50 text-xs">The Easiest Way to Get 6 Pts.</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => cn('nav-link', isActive && 'active', collapsed && 'justify-center px-2')}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) => cn('nav-link mt-4', isActive && 'active', collapsed && 'justify-center px-2')}
            title={collapsed ? 'Admin' : undefined}
          >
            <Shield size={18} className="flex-shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* Premium badge */}
      {!collapsed && !profile?.is_premium && (
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: 'rgba(233,174,52,0.15)', border: '1px dashed rgba(233,174,52,0.4)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-xs">Go Premium</span>
          </div>
          <p className="text-white/50 text-xs mb-2">Unlock AI features & more</p>
          <button onClick={() => navigate('/premium')} className="w-full text-xs py-1.5 rounded-lg font-semibold text-navy-800" style={{ background: '#e9ae34' }}>
            Upgrade Now
          </button>
        </div>
      )}

      {/* User */}
      <div className={cn('p-3 border-t border-white/10', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <button onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: avatarColor, color: 'white' }}>
            {avatarInitial}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: avatarColor, color: 'white' }}>
              {avatarInitial}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{profile?.full_name || 'Student'}</div>
              <div className="text-white/50 text-xs truncate">{profile?.school_name || 'No school'}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <Settings size={14} />
              </button>
              <button onClick={signOut} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'sidebar hidden lg:flex flex-col transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-navy-700 border border-white/10 flex items-center justify-center text-white hover:bg-navy-600 transition-colors z-10"
          style={{ position: 'fixed', left: collapsed ? '52px' : '240px' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar absolute left-0 top-0 bottom-0 w-72 flex flex-col z-10 animate-slide-in-right overflow-y-auto">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: '#e9ae34' }}>🎓</div>
            <span className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>MSCE Prep</span>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: avatarColor, color: 'white' }}>
            {avatarInitial}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t pb-safe z-40 flex"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors min-h-[56px]',
                isActive ? 'text-amber-500' : 'text-[var(--text-muted)]'
              )}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <HelpBubble />
      <PWAInstallPrompt />
    </div>
  )
}
