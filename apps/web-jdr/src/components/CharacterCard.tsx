import { CharacterDto } from '../data/JdrApiClient'

interface CharacterCardProps {
  character: CharacterDto
  onClick?: () => void
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  const topStats = character.stats.slice(0, 3)

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.header}>
        <h3 style={styles.name}>{character.name}</h3>
      </div>
      {character.text && <p style={styles.text}>{character.text}</p>}
      <div style={styles.statsPreview}>
        {topStats.map(stat => (
          <div key={stat.statSlug} style={styles.stat}>
            <span style={styles.statLabel}>{stat.statSlug}</span>
            <span style={styles.statValue}>{stat.value}</span>
            {stat.value !== stat.finalValue && (
              <span style={styles.finalValue}> ({stat.finalValue})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  card: {
    padding: '1rem',
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderColor: 'var(--color-primary)'
    }
  } as React.CSSProperties,
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '0.5rem'
  },
  name: {
    margin: 0,
    fontSize: '1.125rem'
  },

  text: {
    margin: '0.5rem 0',
    fontSize: '0.875rem',
    color: 'var(--color-secondary)'
  },
  statsPreview: {
    display: 'flex' as const,
    gap: '0.5rem',
    marginTop: '0.75rem'
  },
  stat: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    padding: '0.5rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem',
    flex: 1
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-secondary)',
    fontWeight: 'bold'
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'var(--color-primary)'
  },
  finalValue: {
    fontSize: '0.75rem',
    color: 'var(--color-danger)'
  }
}
