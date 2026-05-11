import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JdrApiClient, JdrDto } from '../data/JdrApiClient'
import { CharacterCard } from '../components/CharacterCard'
import { DiceRollFeed } from '../components/DiceRollFeed'

export default function MjPage() {
  const { jdrSlug } = useParams<{ jdrSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) return <div style={styles.container}>Chargement...</div>
  if (error) return <div style={styles.container}>Erreur: {error}</div>
  if (!jdr) return <div style={styles.container}>JdR non trouvé</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>{jdr.name}</h1>
        <div style={styles.actions}>
          <button onClick={() => navigate(`/jdr/${jdrSlug}/mj/config`)}>Configurer</button>
        </div>
      </div>

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
