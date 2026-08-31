import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles.css'
import Foussier from './foussier/Foussier'
import Home from './home/Home'
import { Pf2App } from './pf2/Pf2App'
import { Pf2MjApp } from './pf2-mj/Pf2MjApp'
import './pf2-mj/globals.css'
import CharacterPage from './jdr/CharacterPage'
import JdrSelectionPage from './jdr/JdrSelectionPage'
import Diary from './diary/Diary'
import Resumes from './resumes/Resumes'

const queryClient = new QueryClient()

function LegacyCharacterRedirect() {
  const { jdrSlug, characterSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/characters/${characterSlug}`} replace />
}

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <h1>Page introuvable</h1>
      <p>Cette adresse ne correspond à aucune application publiée.</p>
    </main>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/foussier" element={<Foussier />} />
        <Route path="/pf2" element={<Pf2App />} />
        <Route path="/pf2-mj/*" element={<Pf2MjApp />} />
        <Route path="/jdr" element={<JdrSelectionPage />} />
        <Route path="/jdr/:jdrSlug/characters/:characterSlug" element={<CharacterPage />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/résumés" element={<Resumes />} />

        {/* Old bookmarked/QR-coded links to a character sheet */}
        <Route path="/:jdrSlug/:characterSlug" element={<LegacyCharacterRedirect />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
)
