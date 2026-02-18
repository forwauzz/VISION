import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import EstablishmentSelector from './pages/EstablishmentSelector'
import Dashboard from './pages/Dashboard'
import Session from './pages/Session'
import TranscriptReview from './pages/TranscriptReview'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
        <Route path="/login" element={<ProtectedRoute><Login /></ProtectedRoute>} />
        <Route path="/establishment-selector" element={<ProtectedRoute><EstablishmentSelector /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/session" element={<ProtectedRoute><Session /></ProtectedRoute>} />
        <Route path="/review" element={<ProtectedRoute><TranscriptReview /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
