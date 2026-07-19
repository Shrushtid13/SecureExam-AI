import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import ExamRoom from './pages/ExamRoom'

import StudentsPage from './pages/StudentsPage'
import ResultsPage from './pages/ResultsPage'
import ExamAnalytics from './pages/ExamAnalytics'
import StudentResults from './pages/StudentResults'
import ExamBuilder from './pages/ExamBuilder'
import SubmissionReview from './pages/SubmissionReview'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Student Routes */}
          <Route path="/dashboard/student" element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/exam/:examId/result" element={
            <ProtectedRoute roles={['student']}>
              <SubmissionReview />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/student/results" element={
            <ProtectedRoute roles={['student']}>
              <StudentResults />
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/dashboard/teacher" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/teacher/students" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <StudentsPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/teacher/results" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <ResultsPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/teacher/results/:examId/student/:studentId" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <SubmissionReview />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/teacher/results/:examId" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <ExamAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/teacher/exams/:examId/build" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <ExamBuilder />
            </ProtectedRoute>
          } />

          <Route path="/exam/:examId" element={
            <ProtectedRoute roles={['student']}>
              <ExamRoom />
            </ProtectedRoute>
          } />

          {/* Default redirect for unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
