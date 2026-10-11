import { useCallback, useEffect, useState } from 'react'

type Character = {
  name: string
  foundryUuid: string
  wikiNpcId: string | null
  wikiPageTitle: string | null
  wikiUrl: string | null
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
type Directory = {
  players: Player[]
  wikiOnly: Array<{ npcId: string; name: string; wikiUrl: string | null; ownerIds: string[] }>
  cachedActorCount: number
  checkedAt: string
}
const fallback = <span className="identity-missing">À renseigner</span>

export default function PlayerIdentityTable() {
  const [directory, setDirectory] = useState<Directory | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/apil7r/pf2-mj/player-identities', { cache: 'no-store' })
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
      setDirectory(await response.json() as Directory)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void reload() }, [reload])

  return <section className="settings-card player-identity-card">
    <div className="player-identity-heading">
      <div>
        <h3>Correspondances joueurs · Discord · Foundry · Wiki</h3>
        <p>Registre SQLite des noms de joueurs, joint aux comptes Wiki, aux acteurs Foundry mémorisés et aux fiches PJ. Les liens déduits du nom sont indiqués comme <strong>à confirmer</strong> : ils ne sont pas enregistrés comme associations certaines.</p>
      </div>
      <button type="button" className="refresh" disabled={loading} onClick={() => void reload()}>{loading ? 'Chargement…' : '↻ Actualiser'}</button>
    </div>
    {error && <p role="alert" className="data-transfer-message">{error}</p>}
    {!directory && !error && <p className="missing">Chargement des correspondances…</p>}
    {directory && <>
      <p className="player-identity-stats">{directory.players.length} joueurs · {directory.cachedActorCount} PJ dans le cache Foundry · {directory.players.filter(player => player.status.length).length} dossiers incomplets</p>
      <div className="player-identity-scroll">
        <table className="player-identity-table">
          <thead><tr><th scope="col">Joueur</th><th scope="col">ID Discord</th><th scope="col">Compte Wiki</th><th scope="col">PJ · ID Foundry · fiche Wiki</th><th scope="col">À compléter</th></tr></thead>
          <tbody>{directory.players.map((player, index) => <tr key={player.discordUserId ?? `unknown-${index}`}>
            <th scope="row">{player.playerName}</th>
            <td>{player.discordUserId ? <code title="Identifiant Discord">{player.discordUserId}</code> : fallback}</td>
            <td>{player.wikiUsername ? <strong>{player.wikiUsername}</strong> : fallback}</td>
            <td>{player.characters.length ? <div className="player-identity-characters">{player.characters.map(actor => <div key={actor.foundryUuid} className="player-identity-character">
              <strong>{actor.name}</strong>
              <code title="Identifiant de l'acteur Foundry">{actor.foundryUuid}</code>
              <span>{actor.wikiUrl
                ? <a href={actor.wikiUrl} target="_blank" rel="noreferrer">{actor.wikiPageTitle ?? 'Fiche Wiki'} ↗</a>
                : actor.wikiPageTitle ?? fallback}</span>
              <small className={actor.association === 'confirmed' ? 'identity-ok' : 'identity-warn'}>{actor.association === 'confirmed' ? 'Lien confirmé' : actor.association === 'suggested' ? 'Rapprochement par nom à confirmer' : 'Fiche Wiki manquante'}</small>
              {actor.ownerStatus !== 'confirmed' && <small className="identity-warn">{actor.ownerStatus === 'other' ? 'Propriétaire Wiki différent' : 'Propriétaire Wiki non associé'}</small>}
            </div>)}</div> : fallback}</td>
            <td>{player.status.length ? <ul>{player.status.map((issue, issueIndex) => <li key={issueIndex}>{issue}</li>)}</ul> : <span className="identity-ok">Complet</span>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {directory.wikiOnly.length > 0 && <div className="player-identity-orphans">
        <h4>Fiches PJ Wiki sans rapprochement Foundry</h4>
        <p>Ces fiches existent dans le carnet des joueurs, mais aucune correspondance sûre avec le cache Foundry n’a été trouvée.</p>
        <ul>{directory.wikiOnly.map(profile => <li key={profile.npcId}>{profile.wikiUrl ? <a href={profile.wikiUrl} target="_blank" rel="noreferrer">{profile.name}</a> : profile.name} <code>{profile.npcId}</code></li>)}</ul>
      </div>}
      <p className="player-identity-footer">Pour compléter les comptes Wiki et les propriétaires des PJ, utilise les commandes admin <code>/wiki-admin associer</code> et <code>/wiki-admin associer-personnage</code>. Les correspondances Foundry ↔ Wiki proposées ne sont pas validées automatiquement.</p>
    </>}
  </section>
}
