import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles.css'
import { App } from './app/app'
import WeddingGolf from './wedding-photos/WeddingGolf'
import WeddingSelfie from './wedding-photos/WeddingSelfie'
import WeddingWallSlideshow from './wedding-photos/WeddingWallSlideshow'
import WeddingSoLover from './wedding-photos/WeddingSoLover'
import Foussier from './wedding-photos/Foussier'
import WeddingWallAdmin from './wedding-photos/WeddingWallAdmin'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<Navigate to="/wall" replace />} />
        <Route path="/golf" element={<WeddingGolf />} />
        <Route path="/foussier" element={<Foussier />} />
        <Route path="/so-lover" element={<WeddingSoLover />} />
        <Route path="/selfie" element={<WeddingSelfie />} />
        <Route path="/wall" element={<WeddingWallSlideshow />} />
        <Route path="/admin" element={<WeddingWallAdmin />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
