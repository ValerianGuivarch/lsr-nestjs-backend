import { useEffect, useState } from 'react'
import { JdrApiClient, DiceRollDto, JdrDto } from '../data/JdrApiClient'

interface DiceRollFeedProps {
  jdrSlug: string
  characterSlug?: string
  maxItems?: number
  jdrData?: JdrDto
}

export function DiceRollFeed({ jdrSlug, characterSlug, maxItems = 30, jdrData }: DiceRollFeedProps) {
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

  const getTraitImpacts = (roll: DiceRollDto): string[] => {
    if (!jdrData) return []

    const character = jdrData.characters.find(c => c.slug === roll.characterSlug)
    if (!character) return []

    return character.traitSlugs
      .map(traitSlug => jdrData.traits.find(t => t.slug === traitSlug))
      .filter((trait): trait is NonNullable<typeof trait> => Boolean(trait))
      .map(trait => {
        const modifier = trait.modifiers.find(m => m.statSlug === roll.statSlug)
        if (!modifier || modifier.value === 0) return null
        const sign = modifier.value > 0 ? '+' : ''
        return `${trait.name} (${sign}${modifier.value})`
      })
      .filter((impact): impact is string => Boolean(impact))
  }

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
          {filteredRolls.map(roll => {
            const traitImpacts = getTraitImpacts(roll)
            return (
              <div key={roll.id} style={styles.rollItem}>
                <div style={styles.rollHeader}>
                  <strong>{roll.characterName}</strong> · <strong>{roll.statName}</strong>
                </div>
                <div style={styles.rollMeta}>
                  <span>Valeur: {roll.statValue}</span>
                  <span>{new Date(roll.createdDate).toLocaleTimeString()}</span>
                </div>

                <div style={styles.dices}>
                  {roll.results.map((result, i) => (
                    <span key={i} style={styles.dice}>
                      {result}
                    </span>
                  ))}
                </div>

                {traitImpacts.length > 0 && (
                  <div style={styles.traitsRow}>
                    {traitImpacts.map(impact => (
                      <span key={impact} style={styles.traitBadge}>{impact}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxHeight: '70vh',
    overflow: 'auto'
  },
  title: {
    marginBottom: '0.9rem',
    fontSize: '1.02rem'
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.65rem'
  },
  rollItem: {
    padding: '0.75rem',
    background: 'rgba(14, 27, 46, 0.7)',
    borderRadius: '0.55rem',
    border: '1px solid rgba(130, 171, 244, 0.28)'
  },
  rollHeader: {
    marginBottom: '0.2rem',
    fontSize: '0.9rem',
    color: '#ecf4ff'
  },
  rollMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    color: '#9fb9df',
    marginBottom: '0.45rem'
  },
  dices: {
    display: 'flex',
    gap: '0.42rem',
    flexWrap: 'wrap' as const
  },
  dice: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.05rem',
    height: '2.05rem',
    background: 'linear-gradient(180deg, rgba(39, 70, 112, 0.98), rgba(25, 46, 74, 0.98))',
    border: '1px solid rgba(132, 173, 248, 0.45)',
    borderRadius: '0.42rem',
    fontWeight: 'bold',
    color: '#f4f8ff'
  },
  traitsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.35rem',
    marginTop: '0.55rem'
  },
  traitBadge: {
    border: '1px solid rgba(148, 188, 255, 0.35)',
    background: 'rgba(28, 52, 84, 0.7)',
    borderRadius: '999px',
    padding: '0.14rem 0.52rem',
    fontSize: '0.73rem',
    color: '#d9e9ff'
  }
}
