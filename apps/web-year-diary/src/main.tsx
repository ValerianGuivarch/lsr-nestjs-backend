import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './styles.css'
import { App } from './app/app'
import Diary from './components/Diary'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<Diary />} />
        <Route path="/diary" element={<Diary />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
