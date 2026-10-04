import { FormEvent, useEffect, useMemo, useState } from 'react'
import styles from './recalbox-ui.module.css'

type SessionState = 'loading' | 'guest' | 'authenticated'

interface RecalboxStatus {
  authenticated: true
  storageConfigured: boolean
  inboxConfigured: boolean
}

interface RecalboxSystem {
  name: string
  fullName: string
  manufacturer: string
  type: number
}

interface RecalboxGame {
  path: string
  name: string
  publisher: string
  developer: string
  genre: string
  players: number
  rating: number
  favorite: boolean
}

interface RecalboxGameMetadata {
  name: string
  synopsys: string
  publisher: string
  developer: string
  releaseDate: number
  regions: string
  favorite: boolean
  hidden: boolean
  rating: number
  players: { min: number; max: number }
  genres: { free: string; normalized: number }
  availableMedia: { hasImage: boolean; hasBox: boolean; hasVideo: boolean }
}

interface GameDraft {
  name: string
  description: string
  publisher: string
  developer: string
  genre: string
  players: number
  favorite: boolean
  hidden: boolean
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
  const [systems, setSystems] = useState<RecalboxSystem[]>([])
  const [systemSearch, setSystemSearch] = useState('')
  const [selectedSystem, setSelectedSystem] = useState('')
  const [games, setGames] = useState<RecalboxGame[]>([])
  const [gameSearch, setGameSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState<RecalboxGame | null>(null)
  const [metadata, setMetadata] = useState<RecalboxGameMetadata | null>(null)
  const [draft, setDraft] = useState<GameDraft | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [libraryError, setLibraryError] = useState('')

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

    Promise.all([
      fetch(`${apiBase}/recalbox/status`, { credentials: 'include' }),
      fetch(`${apiBase}/recalbox/systems`, { credentials: 'include' })
    ])
      .then(async ([statusResponse, systemsResponse]) => {
        if (statusResponse.status === 401 || systemsResponse.status === 401) {
          setSession('guest')
          return
        }
        if (!statusResponse.ok || !systemsResponse.ok) throw new Error('api')

        const nextStatus = (await statusResponse.json()) as RecalboxStatus
        const nextSystems = (await systemsResponse.json()) as RecalboxSystem[]
        setStatus(nextStatus)
        setSystems(nextSystems)
        setSelectedSystem((current) => {
          if (current) return current
          if (nextSystems.some((system) => system.name === 'psx')) return 'psx'
          return nextSystems[0]?.name ?? ''
        })
      })
      .catch(() => setLibraryError('Impossible de joindre la bibliothèque Recalbox.'))
  }, [apiBase, session])

  useEffect(() => {
    if (session !== 'authenticated' || !selectedSystem) return

    setLibraryLoading(true)
    setLibraryError('')
    setSelectedGame(null)
    setMetadata(null)
    setDraft(null)
    setSaveState('idle')

    fetch(`${apiBase}/recalbox/games?system=${encodeURIComponent(selectedSystem)}`, {
      credentials: 'include'
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('games')
        return (await response.json()) as RecalboxGame[]
      })
      .then(setGames)
      .catch(() => {
        setGames([])
        setLibraryError('Impossible de charger les jeux de cette console.')
      })
      .finally(() => setLibraryLoading(false))
  }, [apiBase, selectedSystem, session])

  const visibleSystems = useMemo(() => {
    const needle = systemSearch.trim().toLocaleLowerCase('fr')
    if (!needle) return systems
    return systems.filter((system) =>
      `${system.fullName} ${system.manufacturer}`.toLocaleLowerCase('fr').includes(needle)
    )
  }, [systemSearch, systems])

  const visibleGames = useMemo(() => {
    const needle = gameSearch.trim().toLocaleLowerCase('fr')
    if (!needle) return games
    return games.filter((game) =>
      `${game.name} ${game.genre} ${game.publisher} ${game.developer}`.toLocaleLowerCase('fr').includes(needle)
    )
  }, [gameSearch, games])

  const currentSystem = systems.find((system) => system.name === selectedSystem)

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
    setSystems([])
    setGames([])
    setSelectedGame(null)
    setSession('guest')
  }

  async function openGame(game: RecalboxGame) {
    setSelectedGame(game)
    setGameLoading(true)
    setMetadata(null)
    setDraft(null)
    setSaveState('idle')
    setLibraryError('')

    try {
      const response = await fetch(
        `${apiBase}/recalbox/game?system=${encodeURIComponent(selectedSystem)}&path=${encodeURIComponent(game.path)}`,
        { credentials: 'include' }
      )
      if (!response.ok) throw new Error('metadata')
      const nextMetadata = (await response.json()) as RecalboxGameMetadata
      setMetadata(nextMetadata)
      setDraft({
        name: nextMetadata.name || game.name,
        description: nextMetadata.synopsys ?? '',
        publisher: nextMetadata.publisher ?? '',
        developer: nextMetadata.developer ?? '',
        genre: nextMetadata.genres?.free ?? game.genre ?? '',
        players: nextMetadata.players?.max ?? game.players ?? 1,
        favorite: nextMetadata.favorite ?? game.favorite,
        hidden: nextMetadata.hidden ?? false
      })
    } catch {
      setLibraryError('Impossible de charger la fiche de ce jeu.')
    } finally {
      setGameLoading(false)
    }
  }

  async function saveGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedGame || !draft) return

    setSaveState('saving')
    setLibraryError('')

    try {
      const response = await fetch(`${apiBase}/recalbox/game?system=${encodeURIComponent(selectedSystem)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedGame.path, ...draft })
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'save')
      }

      setGames((current) =>
        current.map((game) =>
          game.path === selectedGame.path
            ? {
                ...game,
                name: draft.name,
                publisher: draft.publisher,
                developer: draft.developer,
                genre: draft.genre,
                players: draft.players,
                favorite: draft.favorite
              }
            : game
        )
      )
      setSelectedGame((current) => (current ? { ...current, name: draft.name } : current))
      setMetadata((current) =>
        current
          ? {
              ...current,
              name: draft.name,
              synopsys: draft.description,
              publisher: draft.publisher,
              developer: draft.developer,
              favorite: draft.favorite,
              hidden: draft.hidden,
              players: { min: draft.players, max: draft.players },
              genres: { ...current.genres, free: draft.genre }
            }
          : current
      )
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('error')
      setLibraryError(
        saveError instanceof Error && saveError.message !== 'save' ? saveError.message : 'Échec de la sauvegarde.'
      )
    }
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
          <p className={styles.intro}>Accès privé à la bibliothèque et aux métadonnées des jeux.</p>

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
        <div className={styles.headerActions}>
          <span className={styles.apiState}>{status ? 'API connectée' : 'Connexion API…'}</span>
          <button className={styles.secondaryButton} type="button" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {libraryError ? <div className={styles.alert}>{libraryError}</div> : null}

      <section className={styles.library}>
        <aside className={styles.systemPanel}>
          <div className={styles.panelHeading}>
            <span>Consoles</span>
            <strong>{systems.length}</strong>
          </div>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Rechercher une console"
            value={systemSearch}
            onChange={(event) => setSystemSearch(event.target.value)}
          />
          <div className={styles.systemList}>
            {visibleSystems.map((system) => (
              <button
                key={system.name}
                type="button"
                className={`${styles.systemButton} ${selectedSystem === system.name ? styles.systemButtonActive : ''}`}
                onClick={() => setSelectedSystem(system.name)}
              >
                <span>{system.fullName}</span>
                <small>{system.manufacturer || system.name}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.gamesPanel}>
          <div className={styles.panelHeading}>
            <div>
              <span>{currentSystem?.fullName ?? 'Jeux'}</span>
              <small>{libraryLoading ? 'Chargement…' : `${games.length} jeu${games.length > 1 ? 'x' : ''}`}</small>
            </div>
          </div>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Rechercher un jeu"
            value={gameSearch}
            onChange={(event) => setGameSearch(event.target.value)}
          />
          <div className={styles.gameList}>
            {!libraryLoading && visibleGames.length === 0 ? (
              <p className={styles.emptyState}>Aucun jeu à afficher.</p>
            ) : null}
            {visibleGames.map((game) => (
              <button
                key={game.path}
                type="button"
                className={`${styles.gameButton} ${selectedGame?.path === game.path ? styles.gameButtonActive : ''}`}
                onClick={() => openGame(game)}
              >
                <div>
                  <strong>{game.name}</strong>
                  <span>{game.genre || 'Genre non renseigné'}</span>
                </div>
                <div className={styles.gameMeta}>
                  {game.favorite ? <span title="Favori">★</span> : null}
                  <small>{game.players || 1}J</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.editorPanel}>
          {!selectedGame ? (
            <div className={styles.editorEmpty}>
              <div className={styles.brandMark}>✎</div>
              <h2>Sélectionne un jeu</h2>
              <p>Sa fiche complète apparaîtra ici pour modification.</p>
            </div>
          ) : gameLoading || !draft ? (
            <div className={styles.editorEmpty}>
              <div className={styles.loader} />
            </div>
          ) : (
            <form className={styles.editorForm} onSubmit={saveGame}>
              <div className={styles.editorHeader}>
                <div>
                  <p className={styles.eyebrow}>Métadonnées</p>
                  <h2>{selectedGame.name}</h2>
                </div>
                <span className={styles.regionBadge}>{metadata?.regions || '—'}</span>
              </div>

              <label className={styles.field}>
                <span>Nom</span>
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  rows={7}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </label>

              <div className={styles.twoColumns}>
                <label className={styles.field}>
                  <span>Genre</span>
                  <input value={draft.genre} onChange={(event) => setDraft({ ...draft, genre: event.target.value })} />
                </label>
                <label className={styles.field}>
                  <span>Joueurs</span>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={draft.players}
                    onChange={(event) => setDraft({ ...draft, players: Number(event.target.value) || 1 })}
                  />
                </label>
              </div>

              <div className={styles.twoColumns}>
                <label className={styles.field}>
                  <span>Développeur</span>
                  <input
                    value={draft.developer}
                    onChange={(event) => setDraft({ ...draft, developer: event.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Éditeur</span>
                  <input
                    value={draft.publisher}
                    onChange={(event) => setDraft({ ...draft, publisher: event.target.value })}
                  />
                </label>
              </div>

              <div className={styles.switchRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.favorite}
                    onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })}
                  />
                  <span>Favori</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.hidden}
                    onChange={(event) => setDraft({ ...draft, hidden: event.target.checked })}
                  />
                  <span>Masqué</span>
                </label>
              </div>

              <div className={styles.filePath}>{selectedGame.path}</div>

              <div className={styles.saveBar}>
                <span>
                  {saveState === 'saved' ? 'Enregistré dans gamelist.xml' : ''}
                  {saveState === 'error' ? 'Erreur de sauvegarde' : ''}
                </span>
                <button className={styles.primaryButton} type="submit" disabled={saveState === 'saving'}>
                  {saveState === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  )
}

export default RecalboxUi
