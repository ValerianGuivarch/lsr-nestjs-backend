import { FormEvent, useEffect, useState } from 'react'

type SessionState = 'loading' | 'guest' | 'authenticated'

interface RecalboxStatus {
  authenticated: true
  storageConfigured: boolean
  inboxConfigured: boolean
}

async function readSession(): Promise<boolean> {
  const response = await fetch('/recalbox/api/auth/session', { credentials: 'include' })
  if (!response.ok) return false
  const body = (await response.json()) as { authenticated?: boolean }
  return body.authenticated === true
}

export function App() {
  const [session, setSession] = useState<SessionState>('loading')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<RecalboxStatus | null>(null)

  useEffect(() => {
    readSession()
      .then((authenticated) => setSession(authenticated ? 'authenticated' : 'guest'))
      .catch(() => setSession('guest'))
  }, [])

  useEffect(() => {
    if (session !== 'authenticated') return

    fetch('/recalbox/api/recalbox/status', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) {
          setSession('guest')
          return null
        }
        if (!response.ok) throw new Error('status')
        return (await response.json()) as RecalboxStatus
      })
      .then((nextStatus) => setStatus(nextStatus))
      .catch(() => setStatus(null))
  }, [session])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/recalbox/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        setError(body?.message ?? 'Connexion impossible.')
        return
      }

      setPassword('')
      setStatus(null)
      setSession('authenticated')
    } catch {
      setError('Le serveur Recalbox est indisponible.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await fetch('/recalbox/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => undefined)
    setStatus(null)
    setSession('guest')
  }

  if (session === 'loading') {
    return (
      <main className="page page-centered">
        <div className="loader" aria-label="Chargement" />
      </main>
    )
  }

  if (session === 'guest') {
    return (
      <main className="page page-centered">
        <section className="login-card">
          <div className="brand-mark">R</div>
          <p className="eyebrow">L7R · Administration</p>
          <h1>Recalbox</h1>
          <p className="intro">Accès privé à la bibliothèque, aux métadonnées et aux imports de jeux.</p>

          <form onSubmit={handleLogin}>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">L7R · Administration</p>
          <h1>Recalbox</h1>
        </div>
        <button className="secondary" type="button" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>

      <section className="hero">
        <div>
          <span className="status-dot" />
          <strong>Connexion active</strong>
        </div>
        <p>
          La couche d’authentification est prête. La gestion des jeux sera branchée directement sur les dossiers et les{' '}
          <code>gamelist.xml</code> de Recalbox.
        </p>
      </section>

      <section className="grid" aria-label="Fonctions Recalbox">
        <article className="feature-card">
          <span className="feature-number">01</span>
          <h2>Bibliothèque</h2>
          <p>Jeux regroupés par console, avec recherche, description et métadonnées.</p>
        </article>
        <article className="feature-card">
          <span className="feature-number">02</span>
          <h2>Ajouter un jeu</h2>
          <p>Import depuis le dossier d’attente ou par téléversement, avec détection de console.</p>
        </article>
        <article className="feature-card">
          <span className="feature-number">03</span>
          <h2>Images & descriptions</h2>
          <p>Modification des fiches Recalbox et remplacement des médias depuis le navigateur.</p>
        </article>
      </section>

      <footer className="connection-state">
        API : {status ? 'prête' : 'vérification…'}
        {status ? ` · stockage ${status.storageConfigured ? 'configuré' : 'à configurer'}` : ''}
      </footer>
    </main>
  )
}

export default App
