import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import styled from 'styled-components'
import CharacterPage from '../pages/CharacterPage.tsx'

function LegacyCharacterRedirect() {
  const { jdrSlug, characterSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/characters/${characterSlug}`} replace />
}

function NotFoundShell() {
  return <NotFound>Utilisez le lien de votre fiche personnage.</NotFound>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/jdr/:jdrSlug/characters/:characterSlug" element={<CharacterPage />} />

        {/* Old bookmarked/QR-coded links to a character sheet */}
        <Route path="/:jdrSlug/:characterSlug" element={<LegacyCharacterRedirect />} />

        <Route path="*" element={<NotFoundShell />} />
      </Routes>
    </BrowserRouter>
  )
}

const NotFound = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #6f4f37;
  font-size: 1.05rem;
`

export default App

