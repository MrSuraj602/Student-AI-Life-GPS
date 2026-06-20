import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/useUserStore'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import OnboardingPage from './pages/OnboardingPage'
import PlannerPage from './pages/PlannerPage'
import CareerSimulator from './pages/CareerSimulator'
import MentorChat from './pages/MentorChat'
import FailureRecovery from './pages/FailureRecovery'
import LeaderboardPage from './pages/LeaderboardPage'
import AssessmentPage from './pages/AssessmentPage'

// ProtectedRoute checks if user is logged in, redirecting to /auth if not.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore()
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Secured Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/planner" 
          element={
            <ProtectedRoute>
              <PlannerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/simulator" 
          element={
            <ProtectedRoute>
              <CareerSimulator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assessment" 
          element={
            <ProtectedRoute>
              <AssessmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mentor" 
          element={
            <ProtectedRoute>
              <MentorChat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recovery" 
          element={
            <ProtectedRoute>
              <FailureRecovery />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
