'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { viewPaths } from './routing'

type Character = {
  name: string
  foundryUuid: string
  wikiNpcId: string | null
  wikiPageTitle: string | null
  wikiUrl: string | null
  discordChannelId: string | null
  discordUrl: string | null
  association: 'confirmed' | 'suggested' | 'missing'
  ownerStatus: 'confirmed' | 'missing' | 'other'
}
type Player = {
  discordUserId: string | null
  playerName: string
  wikiUsername: string | null
  characters: Character[]
  status: string[]
}
type Directory = { players: Player[]; checkedAt: string }

export default function PlayerCharactersPage({ selectedNpcId }: { selectedNpcId?: string }) {
  const [directory, setDirectory] = useState<Directory | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let mounted = true
    fetch('/apil7r/pf2-mj/player-identities', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Impossible de récupérer le répertoire des PJ.')
        return response.json() as Promise<Directory>
      })
      .then(value => { if (mounted) setDirectory(value) })
      .catch(reason => { if (mounted) setError(reason instanceof Error ? reason.message : 'Répertoire indisponible') })
    return () => { mounted = false }
  }, [])

  if (error) return <p role="alert">{error}</p>
  if (!directory) return <p>Chargement du répertoire des personnages joueurs…</p>

  const characters = directory.players.flatMap(player =>
    player.characters.map(character => ({ player, character }))
  )
  const selected = selectedNpcId
    ? characters.find(row => row.character.wikiNpcId === selectedNpcId)
    : null

  if (selectedNpcId && !selected) return <section className="player-hub">
    <Link to={viewPaths.players}>← Tous les PJ</Link>
    <h2>Personnage introuvable</h2>
    <p>Aucun Actor lié à cette fiche n'a été trouvé dans le répertoire actuel.</p>
  </section>

  if (selected) {
    const { player, character } = selected
    return <section className="player-hub">
      <Link to={viewPaths.players}>← Tous les PJ</Link>
      <div className="player-hub-panel">
        <small>FICHE PERSONNAGE JOUEUR</small>
        <h2>{character.wikiPageTitle?.replace(/^Personnage:/, '') ?? character.name}</h2>
        <dl className="player-hub-facts">
          <div><dt>Joueur</dt><dd>{player.playerName}</dd></div>
          <div><dt>Compte Wiki</dt><dd>{player.wikiUsername ?? 'Non associé'}</dd></div>
          <div><dt>Compte Discord</dt><dd><code>{player.discordUserId ?? 'Non associé'}</code></dd></div>
          <div><dt>Actor Foundry</dt><dd>{character.name} — <code>{character.foundryUuid}</code></dd></div>
          <div><dt>Référence métier</dt><dd><code>{character.wikiNpcId}</code></dd></div>
          <div><dt>Correspondance</dt><dd>{character.association === 'confirmed' ? 'Confirmée par UUID' : 'À confirmer'}</dd></div>
        </dl>
        <div className="player-hub-links">
          {character.wikiUrl
            ? <a href={character.wikiUrl} target="_blank" rel="noreferrer">Ouvrir la fiche Wiki ↗</a>
            : <span>Fiche Wiki indisponible</span>}
          {character.discordUrl
            ? <a href={character.discordUrl} target="_blank" rel="noreferrer">Ouvrir la discussion Discord ↗</a>
            : <span>Discussion Discord non associée</span>}
        </div>
        <p>Foundry : utilise l'UUID ci-dessus pour retrouver la fiche dans le monde.
          Un lien navigateur direct vers un Actor n'est pas disponible sans intégration spécifique à Foundry.</p>
        <p>Les salons Discord sont privés : les liens sont des raccourcis et restent soumis aux permissions Discord.
          Le bot peut retrouver leurs identifiants mais ne peut pas actuellement lire leurs messages (403).</p>
      </div>
    </section>
  }

  return <section className="player-hub">
    <p>Répertoire des PJ liés à SQLite et Foundry, avec leurs propriétaires et leurs accès externes.
      Plusieurs personnages peuvent appartenir au même joueur.</p>
    <div className="player-hub-grid">
      {characters.map(({ player, character }) => <Link className="player-hub-tile"
        key={character.foundryUuid}
        to={`${viewPaths.players}/${encodeURIComponent(character.wikiNpcId ?? character.foundryUuid)}`}>
        <strong>{character.wikiPageTitle?.replace(/^Personnage:/, '') ?? character.name}</strong>
        <span>{player.playerName}</span>
        <small>{character.association === 'confirmed' ? 'Lien Foundry ↔ Wiki confirmé' : 'Lien à vérifier'}
          {' · '}{character.discordUrl ? 'Discord associé' : 'Discord à compléter'}</small>
      </Link>)}
    </div>
    {directory.players.filter(player => !player.characters.length).map(player =>
      <p key={player.discordUserId ?? player.playerName}>{player.playerName} : aucun PJ Foundry associé.</p>
    )}
  </section>
}
