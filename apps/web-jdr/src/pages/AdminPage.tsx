import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JdrApiClient } from '../data/JdrApiClient'

const VIKING_SLUG = 'vikingtest'
const HP_FEED_SLUG = 'poudlard'

async function seedVikingTest(): Promise<string> {
  // Delete if exists
  try { await JdrApiClient.deleteJdr(VIKING_SLUG) } catch (_) { /* not found, ok */ }

  // Create JdR
  let jdr = await JdrApiClient.createJdr('JdR Tribal Viking', 'Campagne Viking post-apocalyptique')

  // Stats
  for (const stat of ['Charisme', 'Combat', 'Magie', 'Savoir', 'Agriculture', 'Navigation', 'Nature']) {
    jdr = await JdrApiClient.addStat(jdr.slug, stat)
  }

  // Traits Normaux/Positifs
  const normalTraits = [
    { name: 'Cartographe', mods: [{ statSlug: 'savoir', value: 1 }, { statSlug: 'navigation', value: 1 }] },
    { name: 'Fils de l\'ancien chef', mods: [{ statSlug: 'charisme', value: 1 }] },
    { name: 'Capitaine', mods: [{ statSlug: 'navigation', value: 2 }, { statSlug: 'agriculture', value: -1 }] },
    { name: 'Voyageur', mods: [{ statSlug: 'navigation', value: 1 }, { statSlug: 'nature', value: -1 }] },
    { name: 'Beau comme un dieu', mods: [{ statSlug: 'charisme', value: 1 }] },
    { name: 'Guerrier d\'exception', mods: [{ statSlug: 'combat', value: 2 }] },
    { name: 'Forestier', mods: [{ statSlug: 'savoir', value: 1 }, { statSlug: 'nature', value: 1 }] },
    { name: 'Soigneur de bêtes', mods: [{ statSlug: 'agriculture', value: 2 }] },
    { name: 'Travailleur', mods: [{ statSlug: 'agriculture', value: 1 }] },
    { name: 'Force de la nature', mods: [{ statSlug: 'combat', value: 1 }] },
    { name: 'Tellurge', mods: [{ statSlug: 'magie', value: 1 }] },
    { name: 'Sauvage', mods: [{ statSlug: 'combat', value: 1 }, { statSlug: 'nature', value: 1 }, { statSlug: 'charisme', value: -1 }] },
    { name: 'Mémoire eidétique', mods: [{ statSlug: 'savoir', value: 1 }] },
    { name: 'Formé à la magie', mods: [{ statSlug: 'magie', value: 2 }] },
    { name: 'Guerrier héroïque', mods: [{ statSlug: 'combat', value: 1 }, { statSlug: 'charisme', value: 1 }] },
    { name: 'Vif', mods: [{ statSlug: 'combat', value: 1 }] },
    { name: 'Polyvalent', mods: [] },
    { name: 'Volonté forte', mods: [{ statSlug: 'magie', value: 1 }] },
    { name: 'Main verte', mods: [{ statSlug: 'agriculture', value: 1 }] },
    { name: 'Empathie avec la nature', mods: [{ statSlug: 'nature', value: 1 }] },
    { name: 'Berserker', mods: [{ statSlug: 'combat', value: 1 }] },
    { name: 'Brasseur', mods: [{ statSlug: 'agriculture', value: 1 }] },
    { name: 'Compagne remarquable', mods: [] },
    { name: 'Tatouages shamaniques', mods: [] },
    { name: 'Bagarreur', mods: [{ statSlug: 'combat', value: 1 }] }
  ]

  for (const trait of normalTraits) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Normal', trait.mods.length > 0 ? trait.mods : undefined)
  }

  // Traits Pénalisants
  const disadvantageTraits = [
    { name: 'Impatient', mods: [{ statSlug: 'agriculture', value: -1 }] },
    { name: 'Alcoolique', mods: [{ statSlug: 'savoir', value: -1 }] },
    { name: 'Dépensier', mods: [] },
    { name: 'Aveugle', mods: [{ statSlug: 'magie', value: 1 }, { statSlug: 'navigation', value: -1 }, { statSlug: 'nature', value: -1 }, { statSlug: 'combat', value: -1 }] },
    { name: 'Arrogant', mods: [{ statSlug: 'charisme', value: -1 }] },
    { name: 'Balafré', mods: [{ statSlug: 'charisme', value: -1 }] },
    { name: 'Téméraire', mods: [] },
    { name: 'Violent', mods: [{ statSlug: 'combat', value: 1 }, { statSlug: 'charisme', value: -1 }] },
    { name: 'Analphabète', mods: [{ statSlug: 'savoir', value: -1 }] },
    { name: 'Boiteux', mods: [{ statSlug: 'combat', value: -1 }] },
    { name: 'Vénérable', mods: [{ statSlug: 'combat', value: -1 }, { statSlug: 'savoir', value: 2 }] }
  ]

  for (const trait of disadvantageTraits) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Défaut', trait.mods.length > 0 ? trait.mods : undefined)
  }

  // Ressources
  jdr = await JdrApiClient.addResource(jdr.slug, 'Mana', 'specific')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Faveur Spirituelle', 'all')

  // Objets
  jdr = await JdrApiClient.addItem(jdr.slug, 'Hache runique', 'Arme traditionnelle gravée de runes', false, undefined)
  jdr = await JdrApiClient.addItem(jdr.slug, 'Cristal de Freya', 'Fragment divin contenant les visions finales', true, undefined)
  jdr = await JdrApiClient.addItem(jdr.slug, 'Knarr', 'Navire viking pour les longs voyages', true, undefined)

  // Classes
  jdr = await JdrApiClient.addClass(jdr.slug, 'Chef', 1, 'Dirigeant du clan')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Skald', 1, 'Gardien des traditions')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Sorcier', 1, 'Manipulant du mana')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Chaman', 1, 'Communicant avec les esprits')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Trickster', 1, 'Chanceux et chaotique')

  // Groupes - Conseil du clan (pour les 3 PJs)
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Conseil', 'Les 3 dirigeants du nouveau clan')

  // Personnages - Le nouveau Conseil
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Astrid', 'chef', 'conseil', 'Chef de clan - dirigeante politique')
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Leif', 'skald', 'conseil', 'Skald du clan - historien et négociateur')
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Kara', 'chaman', 'conseil', 'Chaman - médiatrice avec les esprits')

  return jdr.slug
}

async function seedHpFeed(): Promise<string> {
  try { await JdrApiClient.deleteJdr(HP_FEED_SLUG) } catch (_) { /* not found, ok */ }

  let jdr = await JdrApiClient.createJdr('Poudlard', 'Seed HP pour la reprise JdR')

  for (const stat of ['Physique', 'Charisme', 'Emotion', 'Agilité', 'Perception', 'Sagesse', 'Intelligence', 'Pouvoir']) {
    jdr = await JdrApiClient.addStat(jdr.slug, stat)
  }

  const classicTraits = [
    { name: 'Athlétique', mods: [{ statSlug: 'physique', value: 1 }] },
    { name: 'Magnétique', mods: [{ statSlug: 'charisme', value: 1 }] },
    { name: 'Perceptif', mods: [{ statSlug: 'perception', value: 1 }] },
    { name: 'Savant', mods: [{ statSlug: 'intelligence', value: 2 }] },
    { name: 'Mystique', mods: [{ statSlug: 'pouvoir', value: 2 }] },
    { name: 'Stoïque', mods: [{ statSlug: 'sagesse', value: 1 }] },
    { name: 'Instinctif', mods: [{ statSlug: 'agilite', value: 1 }, { statSlug: 'sagesse', value: -1 }] },
    { name: 'Empathique', mods: [{ statSlug: 'emotion', value: 1 }, { statSlug: 'physique', value: -1 }] },
    { name: 'Tacticien', mods: [{ statSlug: 'intelligence', value: 1 }, { statSlug: 'emotion', value: -1 }] },
    { name: 'Volontaire', mods: [{ statSlug: 'pouvoir', value: 1 }, { statSlug: 'charisme', value: -1 }] }
  ]

  for (const trait of classicTraits) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Normal', trait.mods)
  }

  const spellTraits = [
    { name: 'Lumos', mods: [{ statSlug: 'pouvoir', value: 1 }] },
    { name: 'Protego', mods: [{ statSlug: 'sagesse', value: 1 }] },
    { name: 'Expelliarmus', mods: [{ statSlug: 'agilite', value: 1 }] },
    { name: 'Stupefix', mods: [{ statSlug: 'emotion', value: 1 }, { statSlug: 'charisme', value: -1 }] }
  ]

  for (const spell of spellTraits) {
    jdr = await JdrApiClient.addTrait(jdr.slug, spell.name, 'Sorts', spell.mods)
  }

  jdr = await JdrApiClient.addResource(jdr.slug, 'PV', 'all')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Gryffondor', 'group')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Serpentard', 'group')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Serdaigle', 'group')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Poufsouffle', 'group')

  jdr = await JdrApiClient.addClass(jdr.slug, 'Sorcier', 4, 'Pratique experte de la magie')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Elève', 2, 'Formation a Poudlard')

  jdr = await JdrApiClient.addGroup(jdr.slug, 'Gryffondor', 'Maison des audacieux')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Serpentard', 'Maison des ambitieux')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Serdaigle', 'Maison des erudits')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Poufsouffle', 'Maison des loyaux')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Poudlard', 'L\'école de sorcellerie')

  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Pearl', 'eleve', undefined, true)
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Actéon', 'eleve', undefined, true)
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Maggie', 'eleve', undefined, true)
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Gédéon', 'eleve', undefined, true)
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Caly', 'eleve', undefined, true)

  const characterSlugByName = new Map(jdr.characters.map(character => [character.name, character.slug]))

  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Pearl')!, 'poufsouffle')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Pearl')!, 'poudlard')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Actéon')!, 'poufsouffle')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Actéon')!, 'poudlard')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Maggie')!, 'poufsouffle')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Maggie')!, 'poudlard')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Gédéon')!, 'gryffondor')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Gédéon')!, 'poudlard')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Caly')!, 'poufsouffle')
  jdr = await JdrApiClient.addCharacterGroup(jdr.slug, characterSlugByName.get('Caly')!, 'poudlard')

  const characterItems = [
    { characterName: 'Pearl', itemName: 'Amulette de Pearl' },
    { characterName: 'Actéon', itemName: 'Lance d\'Actéon' },
    { characterName: 'Maggie', itemName: 'Grimoire de Maggie' },
    { characterName: 'Gédéon', itemName: 'Bouclier de Gédéon' },
    { characterName: 'Caly', itemName: 'Dague de Caly' }
  ]

  for (const { itemName } of characterItems) {
    jdr = await JdrApiClient.addItem(jdr.slug, itemName, `Objet personnel: ${itemName}`, true)
  }

  const itemSlugByName = new Map(jdr.items.map(item => [item.name, item.slug]))

  for (const { characterName, itemName } of characterItems) {
    const characterSlug = characterSlugByName.get(characterName)
    const itemSlug = itemSlugByName.get(itemName)
    if (!characterSlug || !itemSlug) {
      throw new Error(`Impossible d'associer ${itemName} a ${characterName}`)
    }
    jdr = await JdrApiClient.addCharacterItem(jdr.slug, characterSlug, itemSlug, 1)
  }

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
  const [seedingHp, setSeedingHp] = useState(false)
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

  const handleSeedHp = async () => {
    try {
      setSeedingHp(true)
      setError(null)
      const slug = await seedHpFeed()
      await loadJdrs()
      navigate(`/jdr/${slug}/mj`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSeedingHp(false)
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
        <div style={styles.headerActions}>
          <button onClick={handleSeedViking} disabled={seeding || seedingHp}>
            {seeding ? 'Seeding...' : '⚡ Seed VikingTest'}
          </button>
          <button onClick={handleSeedHp} disabled={seeding || seedingHp}>
            {seedingHp ? 'Seeding...' : '⚡ Feed HP'}
          </button>
        </div>
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
                  <button onClick={() => navigate(`/jdr/${jdr.slug}/joueurs`)}>Choix du perso</button>
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
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  } as const,
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
