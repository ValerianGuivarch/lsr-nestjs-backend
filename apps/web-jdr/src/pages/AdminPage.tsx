import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JdrApiClient } from '../data/JdrApiClient'

const VIKING_SLUG = 'vikingtest'

async function seedVikingTest(): Promise<string> {
  // Delete if exists
  try { await JdrApiClient.deleteJdr(VIKING_SLUG) } catch (_) { /* not found, ok */ }

  // Create JdR
  let jdr = await JdrApiClient.createJdr('VikingTest', 'JdR de test Viking')

  // Stats
  for (const stat of ['Force', 'Agilité', 'Intelligence', 'Volonté']) {
    jdr = await JdrApiClient.addStat(jdr.slug, stat)
  }

  // Traits
  jdr = await JdrApiClient.addTrait(jdr.slug, 'Berserker', 'Normal', [{ statSlug: 'force', value: 2 }, { statSlug: 'volonte', value: -1 }])
  jdr = await JdrApiClient.addTrait(jdr.slug, 'Ruse', 'Normal', [{ statSlug: 'intelligence', value: 1 }])

  // Ressources
  jdr = await JdrApiClient.addResource(jdr.slug, 'Vigueur', 'all')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Mana', 'specific')

  // Objets
  jdr = await JdrApiClient.addItem(jdr.slug, 'Hache runique', 'Une hache gravée de runes', false, undefined)
  jdr = await JdrApiClient.addItem(jdr.slug, 'Amulette de Odin', 'Objet unique sacré', true, undefined)

  // Classes et groupes
  jdr = await JdrApiClient.addClass(jdr.slug, 'Guerrier', 3, 'Classe martiale')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Volve', 2, 'Classe mystique')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Clan du Nord', 'Groupe de test')

  // Personnages
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Ragnar', 'guerrier', 'clan-du-nord', 'Chef de clan')
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Freya', 'volve', 'clan-du-nord', 'Volva mystique')

  return jdr.slug
}
interface JdrListItem {
  slug: string
  name: string
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [jdrs, setJdrs] = useState<JdrListItem[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadJdrs = async () => {
    try {
      setLoading(true)
      const data = await JdrApiClient.findAll()
      setJdrs(data)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJdrs()
  }, [])

  const handleDelete = async (slug: string) => {
    if (!confirm(`Supprimer "${slug}" et tous ses éléments ?`)) return
    try {
      await JdrApiClient.deleteJdr(slug)
      await loadJdrs()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleSeedViking = async () => {
    try {
      setSeeding(true)
      setError(null)
      const slug = await seedVikingTest()
      await loadJdrs()
      navigate(`/jdr/${slug}/mj`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return

    try {
      setSaving(true)
      const created = await JdrApiClient.createJdr(name.trim(), text.trim() || undefined)
      setName('')
      setText('')
      await loadJdrs()
      navigate(`/jdr/${created.slug}/mj`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>Admin JdR</h1>
          <p style={styles.subtitle}>Crée un univers puis ouvre sa page MJ.</p>
        </div>
        <button onClick={handleSeedViking} disabled={seeding}>
          {seeding ? 'Seeding...' : '⚡ Seed VikingTest'}
        </button>
      </header>

      <section style={styles.card}>
        <h2>Nouveau JdR</h2>
        <form onSubmit={handleCreate} style={styles.form}>
          <label>
            Nom
            <input
              placeholder="Ex: Chroniques de l'Ombre"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              placeholder="Contexte, ambiance, règles maison..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </label>
          <button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Création...' : 'Créer le JdR'}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2>JdR existants</h2>
        {loading && <p>Chargement...</p>}
        {!loading && jdrs.length === 0 && <p>Aucun JdR pour le moment.</p>}
        {!loading && jdrs.length > 0 && (
          <div style={styles.list}>
            {jdrs.map(jdr => (
              <div key={jdr.slug} style={styles.row}>
                <div>
                  <strong>{jdr.name}</strong>
                  <div style={styles.slug}>{jdr.slug}</div>
                </div>
                <div style={styles.actions}>
                  <button onClick={() => navigate(`/jdr/${jdr.slug}/mj`)}>Ouvrir MJ</button>
                  <button onClick={() => handleDelete(jdr.slug)} style={{ background: 'var(--color-danger)' }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p style={styles.error}>Erreur: {error}</p>}
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
    gap: '1.5rem'
  } as const,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: '0.25rem'
  } as const,
  subtitle: {
    color: 'var(--color-secondary)'
  },
  card: {
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  } as const,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  } as const,
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem',
    padding: '0.75rem'
  } as const,
  slug: {
    fontSize: '0.8rem',
    color: 'var(--color-secondary)'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  } as const,
  error: {
    color: 'var(--color-danger)'
  }
}
