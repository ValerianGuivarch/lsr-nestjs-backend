import { useEffect, useState } from 'react'
import { JdrApiClient, DiceRollDto } from '../data/JdrApiClient'

interface DiceRollFeedProps {
  jdrSlug: string
  characterSlug?: string
  maxItems?: number
}

export function DiceRollFeed({ jdrSlug, characterSlug, maxItems = 30 }: DiceRollFeedProps) {
  const [rolls, setRolls] = useState<DiceRollDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRolls = async () => {
      try {
        setLoading(true)
        const data = await JdrApiClient.getLastRolls(jdrSlug, maxItems)
        setRolls(data)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchRolls()
    const interval = setInterval(fetchRolls, 4000)
    return () => clearInterval(interval)
  }, [jdrSlug, maxItems])

  const filteredRolls = characterSlug ? rolls.filter(r => r.characterSlug === characterSlug) : rolls

  if (error) {
    return <div style={{ color: 'var(--color-danger)' }}>Erreur: {error}</div>
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Lancers de dé</h3>
      {loading && <p>Chargement...</p>}
      {!loading && filteredRolls.length === 0 && <p>Aucun lancer</p>}
      {!loading && filteredRolls.length > 0 && (
        <div style={styles.list}>
          {filteredRolls.map(roll => (
            <div key={roll.id} style={styles.rollItem}>
              <div style={styles.rollHeader}>
                <strong>{roll.characterName}</strong> lancé <strong>{roll.statName}</strong>
              </div>
              <div style={styles.dices}>
                {roll.results.map((result, i) => (
                  <span key={i} style={styles.dice}>
                    {result}
                  </span>
                ))}
              </div>
              <div style={styles.timestamp}>
                {new Date(roll.createdDate).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '1rem',
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    maxHeight: '600px',
    overflow: 'auto'
  },
  title: {
    marginBottom: '1rem',
    fontSize: '1.125rem'
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem'
  },
  rollItem: {
    padding: '0.75rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem',
    borderLeft: '3px solid var(--color-primary)',
  },
  rollHeader: {
    marginBottom: '0.5rem',
    fontSize: '0.875rem'
  },
  dices: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap' as const
  },
  dice: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: '0.25rem',
    fontWeight: 'bold',
    color: 'var(--color-primary)'
  },
  timestamp: {
    fontSize: '0.75rem',
    color: 'var(--color-secondary)'
  }
}
