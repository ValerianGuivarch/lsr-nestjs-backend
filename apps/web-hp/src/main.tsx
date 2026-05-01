import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles.css'
import { App } from './app/app'
import { WizardSheet } from './pages/Hp/WizardSheet'
import { WizardFormCreate } from './pages/Hp/WizardFormCreate'
import { WizardFormUpdate } from './pages/Hp/WizardFormUpdate'
import { SpellForm } from './pages/Hp/SpellForm'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<Navigate to="/hp/create" replace />} />
        <Route path="/hp/:wizardName" element={<WizardSheet />} />
        <Route path="/hp/create" element={<WizardFormCreate />} />
        <Route path="/hp/update/:wizardName" element={<WizardFormUpdate />} />
        <Route path="/hp/spell" element={<SpellForm />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
