import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './hooks/useSettings.js'

import Landing  from './pages/Landing.jsx'
import Login    from './pages/Login.jsx'
import Home     from './pages/Home.jsx'
import Session  from './pages/Session.jsx'
import Settings from './pages/Settings.jsx'
import Profile  from './pages/Profile.jsx'
import Notes    from './pages/Notes.jsx'
import Quiz     from './pages/Quiz.jsx'
import About    from './pages/About.jsx'

/**
 * Protected route wrapper.
 * useAuth inside each page handles the 401 → /login redirect,
 * so we just render directly. This component exists for explicit
 * wrapping if needed in the future.
 */
function ProtectedRoute({ children }) {
  return children
}

export default function App() {
  useTheme()
  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/session"  element={<ProtectedRoute><Session /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/notes"    element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/quiz"     element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/about"    element={<About />} />
      {/* Catch-all → landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
