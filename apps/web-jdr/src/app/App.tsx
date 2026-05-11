import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import AdminPage from '../pages/AdminPage.tsx'
import MjPage from '../pages/MjPage.tsx'
import MjConfigPage from '../pages/MjConfigPage.tsx'
import CharacterPage from '../pages/CharacterPage.tsx'
import CharacterEditPage from '../pages/CharacterEditPage.tsx'
import FeedPage from '../pages/FeedPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:jdrSlug/MJ" element={<MjPage />} />
        <Route path="/:jdrSlug/mj" element={<MJRedirect />} />
        <Route path="/:jdrSlug/MJ/config" element={<MjConfigPage />} />
        <Route path="/:jdrSlug/mj/config" element={<MJConfigRedirect />} />
        <Route path="/:jdrSlug/feed" element={<FeedPage />} />
        <Route path="/:jdrSlug/:characterSlug/edit" element={<CharacterEditPage />} />
        <Route path="/:jdrSlug/:characterSlug" element={<CharacterPage />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function MJRedirect() {
  const { jdrSlug } = useParams()
  return <Navigate to={`/${jdrSlug}/MJ`} replace />
}

function MJConfigRedirect() {
  const { jdrSlug } = useParams()
  return <Navigate to={`/${jdrSlug}/MJ/config`} replace />
}

export default App
