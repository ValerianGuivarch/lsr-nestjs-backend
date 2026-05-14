import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './app/app'
import MiniMJDashboard from './mini-mj/MiniMJDashboard'

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/mini-mj" element={<MiniMJDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
