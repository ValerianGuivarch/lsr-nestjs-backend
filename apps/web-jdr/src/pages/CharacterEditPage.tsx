import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JdrApiClient, JdrDto } from '../data/JdrApiClient'

const TRAIT_TYPES = ['Normal', 'Defaut', 'Sorts', 'Objet', 'Secret'] as const

export default function CharacterEditPage() {
  const { jdrSlug, characterSlug } = useParams<{ jdrSlug: string; characterSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Info form
  const [name, setName] = useState('')
  const [selectedClassSlug, setSelectedClassSlug] = useState('')
  const [classLevel, setClassLevel] = useState(1)
  const [isPlayable, setIsPlayable] = useState(true)
  const [text, setText] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  // Stats form
  const [statValues, setStatValues] = useState<Record<string, number>>({})
  const [savingStats, setSavingStats] = useState(false)

  // Resource editing (local values before update)
  const [resourceValues, setResourceValues] = useState<Record<string, number>>({})

  const upd = (updated: JdrDto) => {
    setJdr(updated)
    const char = updated.characters.find(c => c.slug === characterSlug)
    if (char) setResourceValues(Object.fromEntries(char.resources.map(r => [r.resourceSlug, r.value])))
  }
  const err = (e: unknown) => alert('Erreur: ' + (e as Error).message)

  useEffect(() => {
    if (!jdrSlug) return
    JdrApiClient.findOneBySlug(jdrSlug).then(data => {
      setJdr(data)
      const char = data.characters.find(c => c.slug === characterSlug)
      if (char) {
        setName(char.name)
        setSelectedClassSlug(char.classSlug ?? '')
        setClassLevel(char.classLevel ?? 1)
        setIsPlayable(char.isPlayable)
        setText(char.text)
        setStatValues(Object.fromEntries(char.stats.map(s => [s.statSlug, s.value])))
        setResourceValues(Object.fromEntries(char.resources.map(r => [r.resourceSlug, r.value])))
      }
      setError(null)
    }).catch(e => setError((e as Error).message)).finally(() => setLoading(false))
  }, [jdrSlug, characterSlug])

  const handleSaveInfo = async () => {
    if (!jdrSlug || !characterSlug) return
    try {
      setSavingInfo(true)
      upd(await JdrApiClient.updateCharacter(
        jdrSlug, characterSlug,
        name,
        selectedClassSlug || undefined,
        text,
        isPlayable,
        classLevel
      ))
    } catch (e) { err(e) } finally { setSavingInfo(false) }
  }

  const handleToggleGroup = async (groupSlug: string, inGroup: boolean) => {
    if (!jdrSlug || !characterSlug) return
    try {
      if (inGroup) upd(await JdrApiClient.removeCharacterGroup(jdrSlug, characterSlug, groupSlug))
      else upd(await JdrApiClient.addCharacterGroup(jdrSlug, characterSlug, groupSlug))
    } catch (e) { err(e) }
  }

  const handleSaveStats = async () => {
    if (!jdrSlug || !characterSlug || !jdr) return
    const char = jdr.characters.find(c => c.slug === characterSlug)
    if (!char) return
    try {
      setSavingStats(true)
      let updated = jdr
      for (const stat of char.stats) {
        const newVal = statValues[stat.statSlug] ?? stat.value
        if (newVal !== stat.value) {
          updated = await JdrApiClient.updateCharacterStat(jdrSlug, characterSlug, stat.statSlug, newVal)
        }
      }
      upd(updated)
    } catch (e) { err(e) } finally { setSavingStats(false) }
  }

  const handleToggleTrait = async (traitSlug: string, owned: boolean) => {
    if (!jdrSlug || !characterSlug) return
    try {
      if (owned) upd(await JdrApiClient.removeCharacterTrait(jdrSlug, characterSlug, traitSlug))
      else upd(await JdrApiClient.addCharacterTrait(jdrSlug, characterSlug, traitSlug))
    } catch (e) { err(e) }
  }

  const handleToggleItem = async (itemSlug: string, owned: boolean) => {
    if (!jdrSlug || !characterSlug) return
    try {
      if (owned) upd(await JdrApiClient.removeCharacterItem(jdrSlug, characterSlug, itemSlug))
      else upd(await JdrApiClient.addCharacterItem(jdrSlug, characterSlug, itemSlug))
    } catch (e) { err(e) }
  }

  const handleUpdateResource = async (resourceSlug: string) => {
    if (!jdrSlug || !characterSlug) return
    try {
      upd(await JdrApiClient.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, resourceValues[resourceSlug] ?? 0))
    } catch (e) { err(e) }
  }

  const handleAddResource = async (resourceSlug: string) => {
    if (!jdrSlug || !characterSlug) return
    try {
      const updated = await JdrApiClient.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, 0)
      upd(updated)
      setResourceValues(prev => ({ ...prev, [resourceSlug]: 0 }))
    } catch (e) { err(e) }
  }

  const handleRemoveResource = async (resourceSlug: string) => {
    if (!jdrSlug || !characterSlug) return
    try {
      upd(await JdrApiClient.removeCharacterResource(jdrSlug, characterSlug, resourceSlug))
    } catch (e) { err(e) }
  }

  if (loading) return <div style={s.container}>Chargement...</div>
  if (error) return <div style={s.container}>Erreur: {error}</div>
  if (!jdr) return <div style={s.container}>JdR non trouvé</div>

  const character = jdr.characters.find(c => c.slug === characterSlug)
  if (!character) return <div style={s.container}>Personnage non trouvé</div>

  const ownedTraitSlugs = new Set(character.traitSlugs)
  const ownedItemSlugs = new Set(character.items.map(i => i.itemSlug))
  const ownedResourceSlugs = new Set(character.resources.map(r => r.resourceSlug))
  const ownedGroupSlugs = new Set(character.groupSlugs)

  // Resources that can be added (not yet owned, not type 'group')
  const addableResources = jdr.resources.filter(r => r.type !== 'group' && !ownedResourceSlugs.has(r.slug))

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1>Éditer — {character.name}</h1>
        <button onClick={() => navigate(`/jdr/${jdrSlug}/characters/${characterSlug}`)}>← Retour</button>
      </div>

      {/* ── Informations ───────────────────────────────────── */}
      <section style={s.section}>
        <h2>Informations</h2>
        <div style={s.grid2}>
          <div style={s.field}>
            <label>Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={s.field}>
            <label>Classe</label>
            <select value={selectedClassSlug} onChange={e => setSelectedClassSlug(e.target.value)}>
              <option value="">Aucune</option>
              {jdr.classes.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div style={s.field}>
            <label>Niveau</label>
            <input type="number" min={1} value={classLevel} onChange={e => setClassLevel(parseInt(e.target.value, 10) || 1)} style={{ width: '5rem' }} />
          </div>
          <div style={s.field}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isPlayable} onChange={e => setIsPlayable(e.target.checked)} />
              Jouable (visible sur la page MJ)
            </label>
          </div>
        </div>
        <div style={s.field}>
          <label>Description</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: '100%' }} />
        </div>
        <button onClick={handleSaveInfo} disabled={savingInfo} style={{ marginTop: '0.75rem' }}>
          {savingInfo ? 'Enregistrement...' : 'Enregistrer les infos'}
        </button>
      </section>

      {/* ── Groupes ────────────────────────────────────────── */}
      {jdr.groups.length > 0 && (
        <section style={s.section}>
          <h2>Groupes</h2>
          <div style={s.pillRow}>
            {jdr.groups.map(group => {
              const inGroup = ownedGroupSlugs.has(group.slug)
              return (
                <button
                  key={group.slug}
                  onClick={() => handleToggleGroup(group.slug, inGroup)}
                  style={{ ...s.pill, ...(inGroup ? s.pillActive : s.pillInactive) }}
                >
                  {inGroup ? '✓ ' : '+ '}{group.name}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      {jdr.stats.length > 0 && (
        <section style={s.section}>
          <h2>Stats</h2>
          <div style={s.statsGrid}>
            {jdr.stats.map(stat => (
              <div key={stat.slug} style={s.field}>
                <label>{stat.name}</label>
                <input
                  type="number"
                  value={statValues[stat.slug] ?? 0}
                  onChange={e => setStatValues(prev => ({ ...prev, [stat.slug]: parseInt(e.target.value, 10) || 0 }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveStats() }}
                />
              </div>
            ))}
          </div>
          <button onClick={handleSaveStats} disabled={savingStats} style={{ marginTop: '0.75rem' }}>
            {savingStats ? 'Enregistrement...' : 'Enregistrer les stats'}
          </button>
        </section>
      )}

      {/* ── Traits ─────────────────────────────────────────── */}
      {jdr.traits.length > 0 && (
        <section style={s.section}>
          <h2>Traits</h2>
          {TRAIT_TYPES.map(type => {
            const typeTraits = jdr.traits.filter(t => t.type === type)
            if (typeTraits.length === 0) return null
            return (
              <div key={type} style={{ marginBottom: '1rem' }}>
                <div style={s.typeLabel}>{type}</div>
                <div style={s.pillRow}>
                  {typeTraits.map(trait => {
                    const owned = ownedTraitSlugs.has(trait.slug)
                    return (
                      <button
                        key={trait.slug}
                        onClick={() => handleToggleTrait(trait.slug, owned)}
                        style={{ ...s.pill, ...(owned ? s.pillActive : s.pillInactive) }}
                        title={trait.modifiers.length > 0 ? trait.modifiers.map(m => `${m.statSlug}:${m.value >= 0 ? '+' : ''}${m.value}`).join(', ') : undefined}
                      >
                        {owned ? '✓ ' : '+ '}{trait.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ── Objets ─────────────────────────────────────────── */}
      {jdr.items.length > 0 && (
        <section style={s.section}>
          <h2>Objets</h2>
          <div style={s.pillRow}>
            {jdr.items.map(item => {
              const owned = ownedItemSlugs.has(item.slug)
              return (
                <button
                  key={item.slug}
                  onClick={() => handleToggleItem(item.slug, owned)}
                  style={{ ...s.pill, ...(owned ? s.pillActive : s.pillInactive) }}
                  title={item.description || undefined}
                >
                  {owned ? '✓ ' : '+ '}{item.name}{item.unique ? ' [unique]' : ''}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Ressources ─────────────────────────────────────── */}
      <section style={s.section}>
        <h2>Ressources</h2>
        {character.resources.length === 0 && addableResources.length === 0 && (
          <p style={s.empty}>Aucune ressource définie pour ce JdR.</p>
        )}
        {character.resources.length > 0 && (
          <div style={s.resourceList}>
            {character.resources.map(r => {
              const meta = jdr.resources.find(res => res.slug === r.resourceSlug)
              const canRemove = meta?.type === 'specific'
              return (
                <div key={r.resourceSlug} style={s.resourceRow}>
                  <span style={{ flex: 1 }}>
                    {meta?.name ?? r.resourceSlug}
                    <small style={s.dim}> ({meta?.type ?? '?'})</small>
                  </span>
                  <input
                    type="number"
                    value={resourceValues[r.resourceSlug] ?? r.value}
                    onChange={e => setResourceValues(prev => ({ ...prev, [r.resourceSlug]: parseInt(e.target.value, 10) || 0 }))}
                    onBlur={() => handleUpdateResource(r.resourceSlug)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdateResource(r.resourceSlug) }}
                    style={{ width: '5rem', textAlign: 'center' }}
                  />
                  {canRemove && (
                    <button onClick={() => handleRemoveResource(r.resourceSlug)} style={s.dangerBtn} title="Supprimer cette ressource">X</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {addableResources.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select defaultValue="" onChange={e => { if (e.target.value) { handleAddResource(e.target.value); e.currentTarget.value = '' } }}>
              <option value="">Ajouter une ressource...</option>
              {addableResources.map(r => <option key={r.slug} value={r.slug}>{r.name} ({r.type})</option>)}
            </select>
          </div>
        )}
      </section>
    </div>
  )
}

const s = {
  container: { padding: '1.5rem', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: '2rem' },
  section: { padding: '1.5rem', background: 'var(--color-bg-secondary, white)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', marginBottom: '1.5rem' },
  grid2: { display: 'grid' as const, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  statsGrid: { display: 'grid' as const, gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' },
  field: { display: 'flex' as const, flexDirection: 'column' as const, gap: '0.35rem' },
  typeLabel: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.4rem' },
  pillRow: { display: 'flex' as const, flexWrap: 'wrap' as const, gap: '0.4rem' },
  pill: { padding: '0.3rem 0.7rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem', border: '1.5px solid', transition: 'all 0.1s' },
  pillActive: { background: '#8b5e3c', borderColor: '#8b5e3c', color: '#fff' },
  pillInactive: { background: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text)' },
  resourceList: { display: 'flex' as const, flexDirection: 'column' as const, gap: '0.5rem' },
  resourceRow: { display: 'flex' as const, alignItems: 'center' as const, gap: '0.75rem', padding: '0.4rem 0.6rem', background: 'var(--color-bg)', borderRadius: '0.375rem' },
  dangerBtn: { background: 'var(--color-danger)', minWidth: '2rem' },
  empty: { color: 'var(--color-secondary)', fontStyle: 'italic' as const, margin: 0 },
  dim: { color: 'var(--color-secondary)', fontSize: '0.78rem' },
}
