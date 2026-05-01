import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import './styles.css'
import '../../web-hp/src/styles.css'
import '../../web-misc/src/styles.css'
import '../../web-year-diary/src/styles.css'
import { App } from './app/app'
import { store } from './data/store'
import CharacterSelection from './pages/CharacterSelection/CharacterSelection'
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
import { WizardFormCreate } from '../../web-hp/src/pages/Hp/WizardFormCreate'
import { WizardFormUpdate } from '../../web-hp/src/pages/Hp/WizardFormUpdate'
import { SpellForm } from '../../web-hp/src/pages/Hp/SpellForm'
import WeddingGolf from '../../web-misc/src/wedding-photos/WeddingGolf'
import WeddingSelfie from '../../web-misc/src/wedding-photos/WeddingSelfie'
import WeddingWallSlideshow from '../../web-misc/src/wedding-photos/WeddingWallSlideshow'
import WeddingSoLover from '../../web-misc/src/wedding-photos/WeddingSoLover'
import Foussier from '../../web-misc/src/wedding-photos/Foussier'
import WeddingWallAdmin from '../../web-misc/src/wedding-photos/WeddingWallAdmin'
import Diary from '../../web-year-diary/src/components/Diary'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<CharacterSelection />} />
          <Route path="/hp" element={<Navigate to="/hp/create" replace />} />
          <Route path="/hp/:wizardName" element={<WizardSheet />} />
          <Route path="/hp/create" element={<WizardFormCreate />} />
          <Route path="/hp/update/:wizardName" element={<WizardFormUpdate />} />
          <Route path="/hp/spell" element={<SpellForm />} />
          <Route path="/golf" element={<WeddingGolf />} />
          <Route path="/foussier" element={<Foussier />} />
          <Route path="/so-lover" element={<WeddingSoLover />} />
          <Route path="/selfie" element={<WeddingSelfie />} />
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
