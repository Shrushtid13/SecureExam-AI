import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import ExamRoom from './pages/ExamRoom'

import StudentsPage from './pages/StudentsPage'
import ResultsPage from './pages/ResultsPage'
import ExamAnalytics from './pages/ExamAnalytics'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard/student" element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

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

          <Route path="/dashboard/teacher/results/:examId" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <ExamAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/exam/:examId" element={
            <ProtectedRoute roles={['student']}>
              <ExamRoom />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
