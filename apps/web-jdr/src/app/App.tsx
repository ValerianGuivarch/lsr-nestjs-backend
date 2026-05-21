import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import AdminPage from '../pages/AdminPage.tsx'
import MjPage from '../pages/MjPage.tsx'
import MjConfigPage from '../pages/MjConfigPage.tsx'
import CharacterPage from '../pages/CharacterPage.tsx'
import CharacterEditPage from '../pages/CharacterEditPage.tsx'
import FeedPage from '../pages/FeedPage.tsx'
import JoueurListPage from '../pages/JoueurListPage.tsx'
import JdrListPage from '../pages/JdrListPage.tsx'
import GroupPage from '../pages/GroupPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/jdr" element={<JdrListPage />} />
        <Route path="/jdr/admin" element={<AdminPage />} />
        <Route path="/jdr/:jdrSlug/mj" element={<MjPage />} />
        <Route path="/jdr/:jdrSlug/mj/config" element={<MjConfigPage />} />
        <Route path="/jdr/:jdrSlug/feed" element={<FeedPage />} />
        <Route path="/jdr/:jdrSlug/joueurs" element={<JoueurListPage />} />
        <Route path="/jdr/:jdrSlug/groups/:groupSlug" element={<GroupPage />} />
        <Route path="/jdr/:jdrSlug/characters/:characterSlug/edit" element={<CharacterEditPage />} />
        <Route path="/jdr/:jdrSlug/characters/:characterSlug" element={<CharacterPage />} />

        <Route path="/admin" element={<Navigate to="/jdr/admin" replace />} />
        <Route path="/:jdrSlug/MJ" element={<LegacyMjRedirect />} />
        <Route path="/:jdrSlug/mj" element={<LegacyMjRedirect />} />
        <Route path="/:jdrSlug/MJ/config" element={<LegacyMjConfigRedirect />} />
        <Route path="/:jdrSlug/mj/config" element={<LegacyMjConfigRedirect />} />
        <Route path="/:jdrSlug/feed" element={<LegacyFeedRedirect />} />
        <Route path="/:jdrSlug/:characterSlug/edit" element={<LegacyCharacterEditRedirect />} />
        <Route path="/:jdrSlug/:characterSlug" element={<LegacyCharacterRedirect />} />

        <Route path="/" element={<Navigate to="/jdr" replace />} />
        <Route path="*" element={<Navigate to="/jdr" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function LegacyMjRedirect() {
  const { jdrSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/mj`} replace />
}

function LegacyMjConfigRedirect() {
  const { jdrSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/mj/config`} replace />
}

function LegacyFeedRedirect() {
  const { jdrSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/feed`} replace />
}

function LegacyCharacterRedirect() {
  const { jdrSlug, characterSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/characters/${characterSlug}`} replace />
}

function LegacyCharacterEditRedirect() {
  const { jdrSlug, characterSlug } = useParams()
  return <Navigate to={`/jdr/${jdrSlug}/characters/${characterSlug}/edit`} replace />
}

export default App
