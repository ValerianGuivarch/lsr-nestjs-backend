import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import './styles.css'
import { App } from './app/app'
import { WizardSheet } from './pages/Hp/WizardSheet'
import { WizardFormCreate } from './pages/Hp/WizardFormCreate'
import { WizardFormUpdate } from './pages/Hp/WizardFormUpdate'
import { SpellForm } from './pages/Hp/SpellForm'
import { HpMjPage } from './pages/Hp/HpMjPage'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<Navigate to="/hp/characters/new" replace />} />
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
      </Route>
    </Routes>
  </BrowserRouter>
)

function LegacyHpWizardRedirect() {
  const { wizardName } = useParams<{ wizardName: string }>()
  return <Navigate to={`/hp/characters/${wizardName}`} replace />
}

function LegacyHpWizardEditRedirect() {
  const { wizardName } = useParams<{ wizardName: string }>()
  return <Navigate to={`/hp/characters/${wizardName}/edit`} replace />
}
