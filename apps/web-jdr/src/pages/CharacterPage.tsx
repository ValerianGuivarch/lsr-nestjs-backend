import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JdrApiClient, JdrDto, DiceRollDto } from '../data/JdrApiClient'
import { DiceRollFeed } from '../components/DiceRollFeed'

export default function CharacterPage() {
  const { jdrSlug, characterSlug } = useParams<{ jdrSlug: string; characterSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rolling, setRolling] = useState<string | null>(null)
  const [lastRoll, setLastRoll] = useState<DiceRollDto | null>(null)

  useEffect(() => {
    if (!jdrSlug) return
    const fetchJdr = async () => {
      try {
        setLoading(true)
        const data = await JdrApiClient.findOneBySlug(jdrSlug)
        setJdr(data)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchJdr()
  }, [jdrSlug])

  const character = jdr?.characters.find(c => c.slug === characterSlug)

  const handleRollDice = async (statSlug: string) => {
    if (!jdrSlug || !characterSlug) return
    try {
      setRolling(statSlug)
      const roll = await JdrApiClient.rollDice(jdrSlug, characterSlug, statSlug)
      setLastRoll(roll)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setRolling(null)
    }
  }

  if (loading) return <div style={styles.container}>Chargement...</div>
  if (error) return <div style={styles.container}>Erreur: {error}</div>
  if (!jdr || !character) return <div style={styles.container}>Personnage non trouvé</div>

  const selectedClass = character.classSlug ? jdr.classes.find(c => c.slug === character.classSlug) : undefined
  const selectedGroup = character.groupSlug ? jdr.groups.find(g => g.slug === character.groupSlug) : undefined

  const traitNames = character.traitSlugs
    .map(slug => jdr.traits.find(t => t.slug === slug)?.name)
    .filter(Boolean)

  const itemNames = character.items
    .map(oi => {
      const item = jdr.items.find(i => i.slug === oi.itemSlug)
      return item ? `${item.name}${oi.quantity > 1 ? ` (${oi.quantity})` : ''}` : null
    })
    .filter(Boolean)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1>{character.name}</h1>
          {selectedClass && <p style={styles.level}>Classe: {selectedClass.name} (Lvl {selectedClass.level})</p>}
          {selectedGroup && <p style={styles.level}>Groupe: {selectedGroup.name}</p>}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate(`/${jdrSlug}/${characterSlug}/edit`)}>Éditer</button>
          <button onClick={() => navigate(`/${jdrSlug}/MJ`)}>← Retour</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.main}>
          {character.text && (
            <section style={styles.section}>
              <h2>Description</h2>
              <p>{character.text}</p>
            </section>
          )}

          <section style={styles.section}>
            <h2>Stats</h2>
            <div style={styles.statsGrid}>
              {character.stats.map(stat => (
                <div key={stat.statSlug} style={styles.statCard}>
                  <div style={styles.statName}>{stat.statSlug}</div>
                  <div style={styles.statValues}>
                    <div>
                      <small>Base</small>
                      <div style={styles.value}>{stat.value}</div>
                    </div>
                    {stat.value !== stat.finalValue && (
                      <div>
                        <small>Final</small>
                        <div style={styles.finalValue}>{stat.finalValue}</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRollDice(stat.statSlug)}
                    disabled={rolling === stat.statSlug}
                    style={styles.rollBtn}
                  >
                    {rolling === stat.statSlug ? '...' : 'Lancer'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {traitNames.length > 0 && (
            <section style={styles.section}>
              <h2>Traits</h2>
              <ul>
                {traitNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </section>
          )}

          {itemNames.length > 0 && (
            <section style={styles.section}>
              <h2>Objets</h2>
              <ul>
                {itemNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </section>
          )}

          {character.resources.length > 0 && (
            <section style={styles.section}>
              <h2>Ressources</h2>
              <div style={styles.resourcesList}>
                {character.resources.map(res => {
                  const resource = jdr.resources.find(r => r.slug === res.resourceSlug)
                  return (
                    <div key={res.resourceSlug} style={styles.resourceItem}>
                      <span>{resource?.name || res.resourceSlug}</span>
                      <span style={styles.value}>{res.value}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {lastRoll && lastRoll.characterSlug === characterSlug && (
            <section style={styles.section}>
              <h2>Dernier lancer</h2>
              <div style={styles.lastRoll}>
                <p>{lastRoll.statName} ({lastRoll.results.length}d6)</p>
                <div style={styles.dices}>
                  {lastRoll.results.map((r, i) => (
                    <span key={i} style={styles.dice}>{r}</span>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        <aside style={styles.sidebar}>
          <DiceRollFeed jdrSlug={jdrSlug!} characterSlug={characterSlug} maxItems={15} />
        </aside>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: '2rem'
  },
  level: {
    margin: '0.25rem 0 0 0',
    color: 'var(--color-secondary)',
    fontSize: '0.875rem'
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
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)'
  },
  statsGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem'
  },
  statCard: {
    padding: '1rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem',
    textAlign: 'center' as const
  },
  statName: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--color-secondary)'
  },
  statValues: {
    display: 'flex' as const,
    justifyContent: 'space-around' as const,
    marginBottom: '0.75rem'
  },
  value: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--color-primary)'
  },
  finalValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--color-danger)'
  },
  rollBtn: {
    width: '100%',
    padding: '0.5rem'
  },
  resourcesList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  resourceItem: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    padding: '0.5rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem'
  },
  lastRoll: {
    padding: '1rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem'
  },
  dices: {
    display: 'flex' as const,
    gap: '0.5rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap' as const
  },
  dice: {
    display: 'inline-flex' as any,
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: '0.25rem',
    fontWeight: 'bold',
    color: 'var(--color-primary)'
  }
}
