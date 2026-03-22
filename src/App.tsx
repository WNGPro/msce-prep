import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
const Landing = React.lazy(() => import('./pages/Landing'))
const Auth = React.lazy(() => import('./pages/Auth'))
const Onboarding = React.lazy(() => import('./pages/Onboarding'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Library = React.lazy(() => import('./pages/Library'))
const PaperViewer = React.lazy(() => import('./pages/PaperViewer'))
const Create = React.lazy(() => import('./pages/Create'))
const Tests = React.lazy(() => import('./pages/Tests'))
const TakeTest = React.lazy(() => import('./pages/TakeTest'))
const Progress = React.lazy(() => import('./pages/Progress'))
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Settings = React.lazy(() => import('./pages/Settings'))
const Forum = React.lazy(() => import('./pages/Forum'))
const ForumPost = React.lazy(() => import('./pages/ForumPost'))

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPapers = React.lazy(() => import('./pages/admin/AdminPapers'))
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'))
const AdminContent = React.lazy(() => import('./pages/admin/AdminContent'))
const AdminSchools = React.lazy(() => import('./pages/admin/AdminSchools'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#e9ae34' }}>🎓</div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e9ae34', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/auth" replace />
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user && profile?.onboarding_completed) return <Navigate to="/dashboard" replace />
  if (user && !profile?.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* App — protected */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/papers" element={<Library />} />
          <Route path="/papers/:id" element={<PaperViewer />} />
          <Route path="/create" element={<Create />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/take-test" element={<TakeTest />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumPost />} />
        </Route>

        {/* Admin — role protected */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/papers" element={<AdminRoute><AdminPapers /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
        <Route path="/admin/schools" element={<AdminRoute><AdminSchools /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '0.75rem' }
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
