import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Sparkles, GraduationCap, BarChart3,
  Trophy, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Shield, BookOpen
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import HelpBubble from '../HelpBubble'
import PWAInstallPrompt from '../PWAInstallPrompt'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/papers',    icon: BookOpen,        label: 'Library'   },
  { to: '/create',    icon: Sparkles,        label: 'Create'    },
  { to: '/tests',     icon: GraduationCap,   label: 'Tests'     },
  { to: '/progress',  icon: BarChart3,       label: 'Progress'  },
  { to: '/leaderboard', icon: Trophy,        label: 'Leaderboard' },
]

const BOTTOM_NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Home'     },
  { to: '/papers',      icon: BookOpen,        label: 'Library'  },
  { to: '/create',      icon: Sparkles,        label: 'Create'   },
  { to: '/progress',    icon: BarChart3,       label: 'Progress' },
  { to: '/leaderboard', icon: Trophy,          label: 'Ranks'    },
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
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/10', collapsed && 'justify-center')}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
          style={{ background: '#e9ae34' }}>
          🎓
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm font-display tracking-tight">MSCE Prep</div>
            <div className="text-white/40 text-xs">The Easiest Way to Get 6 Pts.</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150',
              collapsed ? 'justify-center px-3' : '',
              isActive
                ? 'text-[#e9ae34] bg-white/10'
                : 'text-white/55 hover:text-white hover:bg-white/08'
            )}>
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink to="/admin"
            title={collapsed ? 'Admin' : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150 mt-3',
              collapsed ? 'justify-center px-3' : '',
              isActive
                ? 'text-[#e9ae34] bg-white/10'
                : 'text-white/55 hover:text-white hover:bg-white/08'
            )}>
            <Shield size={20} className="flex-shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* AI teaser */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl"
          style={{ background: 'rgba(233,174,52,0.08)', border: '1px dashed rgba(233,174,52,0.3)' }}>
          <span className="text-amber-400 font-semibold text-xs">✨ AI Features Coming Soon</span>
          <p className="text-white/40 text-xs mt-0.5">AI tutoring & adaptive tests arriving soon.</p>
        </div>
      )}

      {/* User */}
      <div className={cn('px-3 py-4 border-t border-white/10', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <button onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: avatarColor, color: 'white' }}>
            {avatarInitial}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: avatarColor, color: 'white' }}>
              {avatarInitial}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{profile?.full_name || 'Student'}</div>
              <div className="text-white/40 text-xs truncate">{profile?.school_name || 'No school'}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => navigate('/settings')}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <Settings size={15} />
              </button>
              <button onClick={signOut}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <LogOut size={15} />
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
          className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
          style={{ position: 'fixed', top: '5rem', left: collapsed ? '52px' : '240px', background: '#1a2d40' }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar absolute left-0 top-0 bottom-0 w-72 flex flex-col z-10 overflow-y-auto">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl" style={{ color: 'var(--text-secondary)' }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: '#e9ae34' }}>🎓</div>
            <span className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>MSCE Prep</span>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: avatarColor, color: 'white' }}>
            {avatarInitial}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t z-40 flex"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1.5 transition-colors',
                isActive
                  ? 'text-amber-500'
                  : 'text-[var(--text-muted)]'
              )}>
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className={cn('text-xs', isActive ? 'font-bold' : 'font-medium')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <HelpBubble />
      <PWAInstallPrompt />
    </div>
  )
}
