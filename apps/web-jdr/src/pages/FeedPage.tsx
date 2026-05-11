import { useNavigate, useParams } from 'react-router-dom'
import { DiceRollFeed } from '../components/DiceRollFeed'

export default function FeedPage() {
  const navigate = useNavigate()
  const { jdrSlug } = useParams<{ jdrSlug: string }>()

  if (!jdrSlug) {
    return <div style={styles.container}>JdR manquant.</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Feed des lancers</h1>
        <div style={styles.actions}>
          <button onClick={() => navigate(`/jdr/${jdrSlug}/mj`)}>Retour MJ</button>
          <button onClick={() => navigate('/jdr/admin')}>Admin</button>
        </div>
      </div>

      <p style={styles.subtitle}>Mise a jour automatique toutes les 4 secondes.</p>
      <DiceRollFeed jdrSlug={jdrSlug} maxItems={30} />
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  } as const,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as const,
  actions: {
    display: 'flex',
    gap: '0.5rem'
  } as const,
  subtitle: {
    color: 'var(--color-secondary)'
  }
}
