import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles.css'
import { App } from './app/app'
import Foussier from './foussier/Foussier'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<Navigate to="/foussier" replace />} />
        <Route path="/foussier" element={<Foussier />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
