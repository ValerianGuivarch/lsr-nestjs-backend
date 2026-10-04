import { FormEvent, useEffect, useState } from 'react'
import styles from './recalbox-ui.module.css'

type SessionState = 'loading' | 'guest' | 'authenticated'

interface RecalboxStatus {
  authenticated: true
  storageConfigured: boolean
  inboxConfigured: boolean
}

export interface RecalboxUiProps {
  apiBase?: string
}

export function RecalboxUi({ apiBase = '/recalbox/api' }: RecalboxUiProps) {
  const [session, setSession] = useState<SessionState>('loading')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<RecalboxStatus | null>(null)

  useEffect(() => {
    fetch(`${apiBase}/auth/session`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return false
        const body = (await response.json()) as { authenticated?: boolean }
        return body.authenticated === true
      })
      .then((authenticated) => setSession(authenticated ? 'authenticated' : 'guest'))
      .catch(() => setSession('guest'))
  }, [apiBase])

  useEffect(() => {
    if (session !== 'authenticated') return

    fetch(`${apiBase}/recalbox/status`, { credentials: 'include' })
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
  }, [apiBase, session])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
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
    await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => undefined)
    setStatus(null)
    setSession('guest')
  }

  if (session === 'loading') {
    return (
      <main className={`${styles.page} ${styles.centered}`}>
        <div className={styles.loader} aria-label="Chargement" />
      </main>
    )
  }

  if (session === 'guest') {
    return (
      <main className={`${styles.page} ${styles.centered}`}>
        <section className={styles.loginCard}>
          <div className={styles.brandMark}>R</div>
          <p className={styles.eyebrow}>L7R · Administration</p>
          <h1 className={styles.title}>Recalbox</h1>
          <p className={styles.intro}>Accès privé à la bibliothèque, aux métadonnées et aux imports de jeux.</p>

          <form className={styles.form} onSubmit={handleLogin}>
            <label className={styles.label} htmlFor="recalbox-password">
              Mot de passe
            </label>
            <input
              className={styles.input}
              id="recalbox-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>L7R · Administration</p>
          <h1 className={styles.title}>Recalbox</h1>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>

      <section className={styles.hero}>
        <div className={styles.statusLine}>
          <span className={styles.statusDot} />
          <strong>Connexion active</strong>
        </div>
        <p>
          La couche d’authentification est prête. La gestion des jeux sera branchée directement sur les dossiers et les{' '}
          <code className={styles.code}>gamelist.xml</code> de Recalbox.
        </p>
      </section>

      <section className={styles.grid} aria-label="Fonctions Recalbox">
        <article className={styles.featureCard}>
          <span className={styles.featureNumber}>01</span>
          <h2>Bibliothèque</h2>
          <p>Jeux regroupés par console, avec recherche, description et métadonnées.</p>
        </article>
        <article className={styles.featureCard}>
          <span className={styles.featureNumber}>02</span>
          <h2>Ajouter un jeu</h2>
          <p>Import depuis le dossier d’attente ou par téléversement, avec détection de console.</p>
        </article>
        <article className={styles.featureCard}>
          <span className={styles.featureNumber}>03</span>
          <h2>Images & descriptions</h2>
          <p>Modification des fiches Recalbox et remplacement des médias depuis le navigateur.</p>
        </article>
      </section>

      <footer className={styles.connectionState}>
        API : {status ? 'prête' : 'vérification…'}
        {status ? ` · stockage ${status.storageConfigured ? 'configuré' : 'à configurer'}` : ''}
      </footer>
    </main>
  )
}

export default RecalboxUi
