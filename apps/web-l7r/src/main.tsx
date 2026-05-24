import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate, useParams } from 'react-router-dom'
import { Provider } from 'react-redux'
import './styles.css'
import '../../web-hp/src/styles.css'
import '../../web-misc/src/styles.css'
import '../../web-year-diary/src/styles.css'
import { App } from './app/app'
import { store } from './data/store'
import CharacterSelection from './pages/CharacterSelection/CharacterSelection'
import HomePage from './pages/Home/HomePage'
import { CharacterSheet } from './pages/CharacterSheet/CharacterSheet'
import { CharacterEdition } from './pages/CharacterEdition/CharacterEdition'
import { MjSheet } from './pages/MjSheet/MjSheet'
import { CharacterControllingSheet } from './pages/CharacterPanelSheet/CharacterControllingSheet'
import { CharacterMunitionsSheet } from './pages/CharacterSheet/CharacterMunitionsSheet'
import { CharacterCartouchesSheet } from './pages/CharacterSheet/CharacterCartoucheSheet'
import { ArcanePrimesSheet } from './pages/CharacterSheet/ArcanePrimesSheet'
import DateTool from './pages/CharacterSelection/DateTool'
import { SpeakingSheet } from './pages/CharacterSheet/SpeakingSheet'
import StoreControl from './components/Store'
import { WizardSheet } from '../../web-hp/src/pages/Hp/WizardSheet'
import { HpMjPage } from '../../web-hp/src/pages/Hp/HpMjPage'
import { WizardFormCreate } from '../../web-hp/src/pages/Hp/WizardFormCreate'
import { WizardFormUpdate } from '../../web-hp/src/pages/Hp/WizardFormUpdate'
import { SpellForm } from '../../web-hp/src/pages/Hp/SpellForm'
import WeddingGolf from '../../web-misc/src/wedding-photos/WeddingGolf'
import WeddingSelfie from '../../web-misc/src/wedding-photos/WeddingSelfie'
import WeddingSouvenirs from '../../web-misc/src/wedding-photos/WeddingSouvenirs'
import WeddingWallSlideshow from '../../web-misc/src/wedding-photos/WeddingWallSlideshow'
import WeddingSoLover from '../../web-misc/src/wedding-photos/WeddingSoLover'
import Foussier from '../../web-misc/src/wedding-photos/Foussier'
import WeddingWallAdmin from '../../web-misc/src/wedding-photos/WeddingWallAdmin'
import Diary from '../../web-year-diary/src/components/Diary'
import GhostApp from '../../web-ghost-dashboard/src/app/app'
import GhostPlayerApp from '../../web-ghost-player/src/app/app'
import AdminPage from '../../web-jdr/src/pages/AdminPage'
import MjPage from '../../web-jdr/src/pages/MjPage'
import MjConfigPage from '../../web-jdr/src/pages/MjConfigPage'
import JdrCharacterPage from '../../web-jdr/src/pages/CharacterPage'
import JdrCharacterEditPage from '../../web-jdr/src/pages/CharacterEditPage'
import FeedPage from '../../web-jdr/src/pages/FeedPage'
import JoueurListPage from '../../web-jdr/src/pages/JoueurListPage'
import JdrListPage from '../../web-jdr/src/pages/JdrListPage'
import Dashboard from './pages/Dashboard/Dashboard'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/menu" element={<CharacterSelection />} />

          <Route path="/l7r" element={<CharacterSelection />} />
          <Route path="/l7r/dashboard" element={<CharacterSelection />} />
          <Route path="/l7r/mj" element={<MjSheet />} />
          <Route path="/l7r/characters/:characterName" element={<CharacterSheet />} />
          <Route
            path="/l7r/characters/:characterName/invocation"
            element={<CharacterControllingSheet />}
          />
          <Route
            path="/l7r/characters/:characterName/arcane-primes"
            element={<ArcanePrimesSheet />}
          />
          <Route
            path="/l7r/characters/:characterName/munitions"
            element={<CharacterMunitionsSheet />}
          />
          <Route
            path="/l7r/characters/:characterName/cartouches"
            element={<CharacterCartouchesSheet />}
          />
          <Route
            path="/l7r/characters/:characterName/edit"
            element={<CharacterEdition />}
          />
          <Route path="/l7r/tools/date" element={<DateTool />} />
          <Route path="/l7r/tools/speaking" element={<SpeakingSheet />} />
          <Route path="/l7r/tools/stores" element={<StoreControl />} />

          <Route path="/yeardiary" element={<Navigate to="/yeardiary/diary" replace />} />
          <Route path="/yeardiary/diary" element={<Diary />} />
          <Route path="/diary" element={<Navigate to="/yeardiary/diary" replace />} />

          <Route path="/ghost" element={<Navigate to="/ghost/dashboard" replace />} />
          <Route path="/ghost/dashboard" element={<GhostApp />} />
          <Route path="/ghost/player" element={<GhostPlayerApp />} />
          <Route path="/ghost-cards" element={<GhostPlayerApp />} />

          <>
            <Route path="/jdr/admin" element={<AdminPage />} />
            <Route path="/jdr/:jdrSlug/mj" element={<MjPage />} />
            <Route path="/jdr/:jdrSlug/mj/config" element={<MjConfigPage />} />
            <Route path="/jdr/:jdrSlug/feed" element={<FeedPage />} />
            <Route path="/jdr/:jdrSlug/joueurs" element={<JoueurListPage />} />
            <Route path="/jdr/:jdrSlug/characters/:characterSlug/edit" element={<JdrCharacterEditPage />} />
            <Route path="/jdr/:jdrSlug/characters/:characterSlug" element={<JdrCharacterPage />} />
            <Route path="/jdr" element={<JdrListPage />} />
            <Route path="/jdr/dashboard" element={<Navigate to="/jdr" replace />} />
          </>

          <Route path="/misc/golf" element={<WeddingGolf />} />
          <Route path="/misc/foussier" element={<Foussier />} />
          <Route path="/misc/so-lover" element={<WeddingSoLover />} />
          <Route path="/misc/selfie" element={<WeddingSelfie />} />
          <Route path="/misc/souvenirs" element={<WeddingSouvenirs />} />
          <Route path="/misc/wall" element={<WeddingWallSlideshow />} />
          <Route path="/misc/admin" element={<WeddingWallAdmin />} />
          <Route path="/wedding" element={<Navigate to="/misc/souvenirs" replace />} />

          <Route path="/hp" element={<Navigate to="/hp/characters/new" replace />} />
          <Route path="/hp/mj" element={<HpMjPage />} />
          <Route path="/hp/characters/new" element={<WizardFormCreate />} />
          <Route path="/hp/characters/:wizardName" element={<WizardSheet />} />
          <Route path="/hp/characters/:wizardName/edit" element={<WizardFormUpdate />} />
          <Route path="/hp/spells/new" element={<SpellForm />} />

          <Route path="/hp/create" element={<Navigate to="/hp/characters/new" replace />} />
          <Route path="/hp/update/:wizardName" element={<LegacyHpWizardEditRedirect />} />
          <Route path="/hp/spell" element={<Navigate to="/hp/spells/new" replace />} />
          <Route path="/hp/:wizardName" element={<LegacyHpWizardRedirect />} />
          <Route path="/golf" element={<WeddingGolf />} />
          <Route path="/foussier" element={<Foussier />} />
          <Route path="/so-lover" element={<WeddingSoLover />} />
          <Route path="/selfie" element={<WeddingSelfie />} />
          <Route path="/souvenirs" element={<WeddingSouvenirs />} />
          <Route path="/wall" element={<WeddingWallSlideshow />} />
          <Route path="/admin" element={<WeddingWallAdmin />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/stores" element={<StoreControl />} />
          <Route path="/date" element={<DateTool />} />
          <Route path="/speaking" element={<SpeakingSheet />} />
          <Route path="/characters/:characterName" element={<CharacterSheet />} />
          <Route
            path="/characters/:characterName/invocation"
            element={<CharacterControllingSheet />}
          />
          <Route
            path="/characters/:characterName/arcane-primes"
            element={<ArcanePrimesSheet />}
          />
          <Route
            path="/characters/:characterName/munitions"
            element={<CharacterMunitionsSheet />}
          />
          <Route
            path="/characters/:characterName/cartouches"
            element={<CharacterCartouchesSheet />}
          />
          <Route path="/mj" element={<MjSheet />} />
          <Route
            path="/characters/:characterName/edit"
            element={<CharacterEdition />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </Provider>
)

function LegacyHpWizardRedirect() {
  const { wizardName } = useParams<{ wizardName: string }>()
  return <Navigate to={`/hp/characters/${wizardName}`} replace />
}

function LegacyHpWizardEditRedirect() {
  const { wizardName } = useParams<{ wizardName: string }>()
  return <Navigate to={`/hp/characters/${wizardName}/edit`} replace />
}

