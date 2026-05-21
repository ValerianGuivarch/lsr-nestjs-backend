import { useEffect, useState } from 'react'
import { JdrApiClient, DiceRollDto, JdrDto, RollState } from '../data/JdrApiClient'

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

  const resolveRollState = (roll: DiceRollDto): RollState => roll.rollState ?? 'normal'

  const getSuccessCountForDie = (die: number, rollState: RollState): number => {
    if (rollState === 'disadvantage') return die === 6 ? 1 : 0
    if (rollState === 'advantage') return die >= 4 ? 1 : 0
    if (rollState === 'double_advantage') {
      if (die === 6) return 2
      return die >= 4 ? 1 : 0
    }
    return die >= 5 ? 1 : 0
  }

  const getSuccessCount = (results: number[], rollState: RollState): number => {
    return results.reduce((total, die) => total + getSuccessCountForDie(die, rollState), 0)
  }

  const getRollStateLabel = (rollState: RollState): string => {
    if (rollState === 'disadvantage') return 'Desavantage'
    if (rollState === 'advantage') return 'Avantage'
    if (rollState === 'double_advantage') return 'Double avantage'
    return 'Normal'
  }

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
      <h3 style={styles.title}>🎲 Lancers de dé</h3>
      {loading && <p>Chargement...</p>}
      {!loading && filteredRolls.length === 0 && <p>Aucun lancer</p>}
      {!loading && filteredRolls.length > 0 && (
        <div style={styles.list}>
          {filteredRolls.map(roll => {
            const isArbitrary = roll.isArbitrary === true
            if (isArbitrary) {
              const total = roll.results.reduce((a, b) => a + b, 0)
              return (
                <div key={roll.id} style={styles.rollItem}>
                  <div style={styles.rollHeader}>
                    🎲 <strong>{roll.characterName}</strong> · <strong>{roll.formula ?? roll.statName}</strong>
                  </div>
                  <div style={styles.rollMeta}>
                    <span>{new Date(roll.createdDate).toLocaleTimeString()}</span>
                  </div>
                  <div style={styles.dices}>
                    {roll.results.map((result, i) => (
                      <span key={i} style={{ ...styles.dice, ...styles.diceArbitrary }}>
                        {result}
                      </span>
                    ))}
                  </div>
                  <div style={{ ...styles.resultRow, marginTop: '0.45rem' }}>
                    Total: <strong>{total}</strong>
                    {roll.results.length > 1 && <span style={{ color: '#8a6744', marginLeft: '0.5rem', fontSize: '0.78rem' }}>({roll.results.length} dés)</span>}
                  </div>
                </div>
              )
            }
            const traitImpacts = getTraitImpacts(roll)
            const rollState = resolveRollState(roll)
            const successCount = getSuccessCount(roll.results, rollState)
            return (
              <div key={roll.id} style={styles.rollItem}>
                <div style={styles.rollHeader}>
                  🎲 <strong>{roll.characterName}</strong> · <strong>{roll.statName}</strong>
                </div>
                <div style={styles.rollMeta}>
                  <span>Valeur: {roll.statValue}</span>
                  <span>Etat: {getRollStateLabel(rollState)}</span>
                  <span>{new Date(roll.createdDate).toLocaleTimeString()}</span>
                </div>

                <div style={styles.resultRow}>
                  Resultat: <strong>{successCount}</strong> {successCount > 1 ? 'reussites' : 'reussite'}
                </div>

                <div style={styles.dices}>
                  {roll.results.map((result, i) => (
                    <span
                      key={i}
                      style={{
                        ...styles.dice,
                        ...(getSuccessCountForDie(result, rollState) > 0 ? styles.diceSuccess : styles.diceFailure),
                        ...(rollState === 'double_advantage' && result === 6 ? styles.diceCritical : {})
                      }}
                    >
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
    background: 'rgba(250, 239, 213, 0.92)',
    borderRadius: '0.55rem',
    border: '1px solid rgba(176, 133, 85, 0.35)'
  },
  rollHeader: {
    marginBottom: '0.2rem',
    fontSize: '0.9rem',
    color: '#5b3b2e'
  },
  rollMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.6rem',
    flexWrap: 'wrap' as const,
    fontSize: '0.78rem',
    color: '#8a6744',
    marginBottom: '0.45rem'
  },
  resultRow: {
    marginBottom: '0.45rem',
    color: '#684730',
    fontSize: '0.82rem'
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
    borderRadius: '0.42rem',
    fontWeight: 'bold',
    color: '#f4f8ff'
  },
  diceSuccess: {
    background: 'linear-gradient(180deg, rgba(105, 156, 97, 0.98), rgba(66, 114, 61, 0.98))',
    border: '1px solid rgba(136, 224, 160, 0.55)',
    color: '#effff2'
  },
  diceFailure: {
    background: 'linear-gradient(180deg, rgba(182, 104, 91, 0.98), rgba(148, 72, 60, 0.98))',
    border: '1px solid rgba(214, 128, 128, 0.45)',
    color: '#ffecec'
  },
  diceArbitrary: {
    background: 'linear-gradient(180deg, rgba(91, 115, 160, 0.98), rgba(60, 85, 130, 0.98))',
    border: '1px solid rgba(140, 168, 220, 0.5)',
    color: '#e8f0ff'
  },
  diceCritical: {
    fontWeight: 900,
    borderWidth: '2px',
    boxShadow: '0 0 0 1px rgba(250, 226, 142, 0.6) inset'
  },
  traitsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.35rem',
    marginTop: '0.55rem'
  },
  traitBadge: {
    border: '1px solid rgba(173, 129, 81, 0.35)',
    background: 'rgba(246, 229, 195, 0.85)',
    borderRadius: '999px',
    padding: '0.14rem 0.52rem',
    fontSize: '0.73rem',
    color: '#654630'
  }
}
