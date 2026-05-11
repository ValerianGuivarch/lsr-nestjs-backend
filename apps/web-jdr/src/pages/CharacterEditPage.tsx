import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JdrApiClient, JdrDto } from '../data/JdrApiClient'

export default function CharacterEditPage() {
  const { jdrSlug, characterSlug } = useParams<{ jdrSlug: string; characterSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [selectedClassSlug, setSelectedClassSlug] = useState<string>('')
  const [selectedGroupSlug, setSelectedGroupSlug] = useState<string>('')
  const [text, setText] = useState('')
  const [statValues, setStatValues] = useState<Record<string, number>>({})
  const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!jdrSlug) return
    const fetchJdr = async () => {
      try {
        setLoading(true)
        const data = await JdrApiClient.findOneBySlug(jdrSlug)
        setJdr(data)

        const char = data.characters.find(c => c.slug === characterSlug)
        if (char) {
          setName(char.name)
          setSelectedClassSlug(char.classSlug ?? '')
          setSelectedGroupSlug(char.groupSlug ?? '')
          setText(char.text)
          setStatValues(Object.fromEntries(char.stats.map(s => [s.statSlug, s.value])))
          setSelectedTraits(new Set(char.traitSlugs))
          setSelectedItems(new Set(char.items.map(i => i.itemSlug)))
        }
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchJdr()
  }, [jdrSlug, characterSlug])

  const handleSave = async () => {
    if (!jdrSlug || !characterSlug) return
    try {
      setSaving(true)
      let updated = await JdrApiClient.updateCharacter(
        jdrSlug,
        characterSlug,
        name,
        selectedClassSlug || undefined,
        selectedGroupSlug || undefined,
        text
      )

      // Update stats
      const character = updated.characters.find(c => c.slug === characterSlug)
      if (character) {
        for (const stat of character.stats) {
          const newValue = statValues[stat.statSlug]
          if (newValue !== stat.value) {
            updated = await JdrApiClient.updateCharacterStat(jdrSlug, characterSlug, stat.statSlug, newValue)
          }
        }
      }

      // Sync traits
      const oldTraits = new Set(character?.traitSlugs || [])
      for (const trait of oldTraits) {
        if (!selectedTraits.has(trait)) {
          updated = await JdrApiClient.removeCharacterTrait(jdrSlug, characterSlug, trait)
        }
      }
      for (const trait of selectedTraits) {
        if (!oldTraits.has(trait)) {
          updated = await JdrApiClient.addCharacterTrait(jdrSlug, characterSlug, trait)
        }
      }

      // Sync items
      const oldItems = new Set(character?.items.map(i => i.itemSlug) || [])
      for (const item of oldItems) {
        if (!selectedItems.has(item)) {
          updated = await JdrApiClient.removeCharacterItem(jdrSlug, characterSlug, item)
        }
      }
      for (const item of selectedItems) {
        if (!oldItems.has(item)) {
          updated = await JdrApiClient.addCharacterItem(jdrSlug, characterSlug, item)
        }
      }

      setJdr(updated)
      navigate(`/${jdrSlug}/${characterSlug}`)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={styles.container}>Chargement...</div>
  if (error) return <div style={styles.container}>Erreur: {error}</div>
  if (!jdr) return <div style={styles.container}>JdR non trouvé</div>

  const character = jdr.characters.find(c => c.slug === characterSlug)
  if (!character) return <div style={styles.container}>Personnage non trouvé</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Éditer {name || 'Personnage'}</h1>
        <button onClick={() => navigate(`/${jdrSlug}/${characterSlug}`)}>← Retour</button>
      </div>

      <div style={styles.form}>
        <section style={styles.section}>
          <h2>Informations</h2>
          <div style={styles.formGroup}>
            <label>Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label>Classe</label>
            <select value={selectedClassSlug} onChange={e => setSelectedClassSlug(e.target.value)}>
              <option value="">Aucune</option>
              {jdr.classes.map(clazz => (
                <option key={clazz.slug} value={clazz.slug}>
                  {clazz.name} (Lvl {clazz.level})
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label>Groupe</label>
            <select value={selectedGroupSlug} onChange={e => setSelectedGroupSlug(e.target.value)}>
              <option value="">Aucun</option>
              {jdr.groups.map(group => (
                <option key={group.slug} value={group.slug}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label>Description</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} />
          </div>
        </section>

        <section style={styles.section}>
          <h2>Stats</h2>
          <div style={styles.statsGrid}>
            {jdr.stats.map(stat => (
              <div key={stat.slug} style={styles.statInput}>
                <label>{stat.name}</label>
                <input
                  type="number"
                  value={statValues[stat.slug] || 0}
                  onChange={e => setStatValues({ ...statValues, [stat.slug]: parseInt(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
        </section>

        {jdr.traits.length > 0 && (
          <section style={styles.section}>
            <h2>Traits</h2>
            <div style={styles.checkboxList}>
              {jdr.traits.map(trait => (
                <label key={trait.slug} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTraits.has(trait.slug)}
                    onChange={e => {
                      const newTraits = new Set(selectedTraits)
                      if (e.target.checked) {
                        newTraits.add(trait.slug)
                      } else {
                        newTraits.delete(trait.slug)
                      }
                      setSelectedTraits(newTraits)
                    }}
                  />
                  {trait.name}
                </label>
              ))}
            </div>
          </section>
        )}

        {jdr.items.length > 0 && (
          <section style={styles.section}>
            <h2>Objets</h2>
            <div style={styles.checkboxList}>
              {jdr.items.map(item => (
                <label key={item.slug} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.slug)}
                    onChange={e => {
                      const newItems = new Set(selectedItems)
                      if (e.target.checked) {
                        newItems.add(item.slug)
                      } else {
                        newItems.delete(item.slug)
                      }
                      setSelectedItems(newItems)
                    }}
                  />
                  {item.name}
                </label>
              ))}
            </div>
          </section>
        )}

        <div style={styles.actions}>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={() => navigate(`/${jdrSlug}/${characterSlug}`)}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '2rem'
  },
  form: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '2rem'
  },
  section: {
    padding: '1.5rem',
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)'
  },
  formGroup: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  statsGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem'
  },
  statInput: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  checkboxList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  checkboxLabel: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '0.5rem',
    cursor: 'pointer'
  },
  actions: {
    display: 'flex' as const,
    gap: '1rem'
  }
}
