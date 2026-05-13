import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DraftDto, JdrApiClient, JdrDto } from '../data/JdrApiClient'
import { CharacterCard } from '../components/CharacterCard'
import { DiceRollFeed } from '../components/DiceRollFeed'

export default function MjPage() {
  const { jdrSlug } = useParams<{ jdrSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [draft, setDraft] = useState<DraftDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jdrSlug) return

    const fetchJdr = async () => {
      try {
        const [data, activeDraft] = await Promise.all([
          JdrApiClient.findOneBySlug(jdrSlug),
          JdrApiClient.getActiveDraft(jdrSlug)
        ])
        setJdr(data)
        setDraft(activeDraft)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchJdr()
    const id = setInterval(fetchJdr, 2500)
    return () => clearInterval(id)
  }, [jdrSlug])

  const traitsBySlug = useMemo(
    () => Object.fromEntries((jdr?.traits ?? []).map((trait) => [trait.slug, trait])),
    [jdr]
  )

  const charactersBySlug = useMemo(
    () => Object.fromEntries((jdr?.characters ?? []).map((character) => [character.slug, character])),
    [jdr]
  )

  const unselectedFinalTraitSlugs = useMemo(() => {
    if (!draft) return []
    return Object.values(draft.currentHandsByCharacter).flat()
  }, [draft])

  const closeDraft = async () => {
    if (!jdrSlug || !confirm('Arrêter le draft actif ?')) return
    try {
      await JdrApiClient.closeDraft(jdrSlug)
      setDraft(null)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    }
  }

  if (loading) return <div style={styles.container}>Chargement...</div>
  if (error) return <div style={styles.container}>Erreur: {error}</div>
  if (!jdr) return <div style={styles.container}>JdR non trouvé</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>{jdr.name}</h1>
        <div style={styles.actions}>
          <button onClick={() => navigate(`/jdr/${jdrSlug}/mj/config`)}>Onglet Draft</button>
        </div>
      </div>

      <section style={styles.draftBox}>
        <h2>Draft de traits</h2>
        {draft ? (
          <div style={styles.draftStack}>
            <div style={styles.draftActiveRow}>
              <span>
                Draft {draft.status === 'active' ? 'actif' : 'terminé'}: {draft.name} · groupe {draft.groupSlug} · type {draft.traitType} · tour {draft.currentRound}/{draft.totalRounds}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => navigate(`/jdr/${jdrSlug}/draft/feed`)}>Voir le feed</button>
                {draft.status === 'active' ? (
                  <button onClick={closeDraft}>Arrêter le draft</button>
                ) : (
                  <span style={styles.draftDoneBadge}>Finalisé</span>
                )}
              </div>
            </div>

            <div style={styles.draftMonitorGrid}>
              <div style={styles.draftPanel}>
                <h3 style={styles.panelTitle}>Mains restantes</h3>
                {draft.characterOrder.map((characterSlug) => {
                  const traitSlugs = draft.currentHandsByCharacter[characterSlug] ?? []
                  return (
                    <div key={characterSlug} style={styles.monitorRow}>
                      <strong>{charactersBySlug[characterSlug]?.name || characterSlug}</strong>
                      <div style={styles.chipsWrap}>
                        {traitSlugs.length === 0 && <span style={styles.emptyHint}>Aucune carte</span>}
                        {traitSlugs.map((traitSlug) => (
                          <span key={`${characterSlug}-${traitSlug}`} style={styles.chip}>
                            {traitsBySlug[traitSlug]?.name || traitSlug}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={styles.draftPanel}>
                <h3 style={styles.panelTitle}>Picks par tour</h3>
                {draft.rounds.map((round) => (
                  <div key={round.round} style={styles.roundBlock}>
                    <strong>Tour {round.round}</strong>
                    <div style={styles.chipsWrap}>
                      {draft.characterOrder.map((characterSlug) => {
                        const pickedSlug = round.picks[characterSlug]
                        const label = pickedSlug
                          ? `${charactersBySlug[characterSlug]?.name || characterSlug}: ${traitsBySlug[pickedSlug]?.name || pickedSlug}`
                          : `${charactersBySlug[characterSlug]?.name || characterSlug}: en attente`
                        return (
                          <span key={`${round.round}-${characterSlug}`} style={pickedSlug ? styles.chip : styles.pendingChip}>
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.draftPanel}>
                <h3 style={styles.panelTitle}>Cartes non sélectionnées finales</h3>
                <div style={styles.chipsWrap}>
                  {unselectedFinalTraitSlugs.length === 0 && <span style={styles.emptyHint}>Aucune</span>}
                  {unselectedFinalTraitSlugs.map((traitSlug, index) => (
                    <span key={`${traitSlug}-${index}`} style={styles.chip}>
                      {traitsBySlug[traitSlug]?.name || traitSlug}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyDraftHint}>
            Aucun draft actif. Créez-le dans l'onglet Draft.
          </div>
        )}
      </section>

      <div style={styles.content}>
        <div style={styles.main}>
          <section style={styles.section}>
            <h2>Personnages</h2>
            {jdr.characters.length === 0 ? (
              <p>Aucun personnage. Allez à la config pour en créer.</p>
            ) : (
              <div style={styles.grid}>
                {jdr.characters.map(char => (
                  <CharacterCard
                    key={char.slug}
                    character={char}
                    onClick={() => navigate(`/jdr/${jdrSlug}/characters/${char.slug}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside style={styles.sidebar}>
          <DiceRollFeed jdrSlug={jdrSlug!} maxItems={20} />
        </aside>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '2rem'
  },
  actions: {
    display: 'flex' as const,
    gap: '0.75rem'
  },
  draftBox: {
    border: '1px solid #d6a34f',
    borderRadius: '12px',
    padding: '0.9rem',
    marginBottom: '1rem',
    background: 'rgba(255, 174, 78, 0.08)'
  },
  draftForm: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.8rem',
    alignItems: 'end'
  },
  draftActiveRow: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: '1rem',
    flexWrap: 'wrap' as const
  },
  draftStack: {
    display: 'grid' as const,
    gap: '0.8rem'
  },
  draftMonitorGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '0.8rem'
  },
  draftPanel: {
    border: '1px solid rgba(163, 118, 43, 0.45)',
    borderRadius: '10px',
    background: 'rgba(30, 22, 10, 0.28)',
    padding: '0.65rem'
  },
  panelTitle: {
    margin: '0 0 0.55rem 0',
    fontSize: '0.95rem'
  },
  monitorRow: {
    display: 'grid' as const,
    gap: '0.35rem',
    marginBottom: '0.55rem'
  },
  chipsWrap: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: '0.35rem'
  },
  chip: {
    border: '1px solid rgba(229, 196, 134, 0.5)',
    borderRadius: '999px',
    padding: '0.12rem 0.5rem',
    fontSize: '0.76rem',
    background: 'rgba(89, 58, 22, 0.35)'
  },
  pendingChip: {
    border: '1px solid rgba(158, 158, 158, 0.42)',
    borderRadius: '999px',
    padding: '0.12rem 0.5rem',
    fontSize: '0.76rem',
    background: 'rgba(55, 55, 55, 0.24)',
    color: '#737373'
  },
  emptyHint: {
    fontSize: '0.8rem',
    color: '#6b6b6b'
  },
  roundBlock: {
    marginBottom: '0.55rem',
    display: 'grid' as const,
    gap: '0.35rem'
  },
  draftDoneBadge: {
    border: '1px solid #3f7f45',
    borderRadius: '999px',
    padding: '0.2rem 0.6rem',
    background: 'rgba(51, 117, 58, 0.22)',
    color: '#225e2a',
    fontSize: '0.8rem',
    fontWeight: 700
  },
  content: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 300px',
    gap: '2rem'
  },
  main: {
    minWidth: 0
  },
  sidebar: {
    height: 'fit-content',
    position: 'sticky' as const,
    top: '1rem'
  },
  section: {
    marginBottom: '2rem'
  },
  grid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem'
  }
}
