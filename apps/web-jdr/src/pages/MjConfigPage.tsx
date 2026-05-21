import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { JdrApiClient, JdrDto, TraitDto } from '../data/JdrApiClient'

export default function MjConfigPage() {
  const { jdrSlug } = useParams<{ jdrSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // JdR infos
  const [jdrName, setJdrName] = useState('')
  const [jdrText, setJdrText] = useState('')

  // Stats
  const [newStatName, setNewStatName] = useState('')
  const [editingStatSlug, setEditingStatSlug] = useState<string | null>(null)
  const [editingStatName, setEditingStatName] = useState('')

  // Traits
  const [newTraitName, setNewTraitName] = useState('')
  const [newTraitType, setNewTraitType] = useState('Normal')
  const [traitModifiers, setTraitModifiers] = useState<Record<string, number>>({})
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null)
  const [editingTraitSlug, setEditingTraitSlug] = useState<string | null>(null)
  const [editingTraitName, setEditingTraitName] = useState('')
  const [editingTraitType, setEditingTraitType] = useState('')
  const [editingTraitModifiers, setEditingTraitModifiers] = useState<Record<string, number>>({})

  // Ressources
  const [newResourceName, setNewResourceName] = useState('')
  const [newResourceType, setNewResourceType] = useState('all')
  const [editingResourceSlug, setEditingResourceSlug] = useState<string | null>(null)
  const [editingResourceName, setEditingResourceName] = useState('')
  const [editingResourceType, setEditingResourceType] = useState('')

  // Objets
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemUnique, setNewItemUnique] = useState(false)
  const [editingItemSlug, setEditingItemSlug] = useState<string | null>(null)
  const [editingItemName, setEditingItemName] = useState('')
  const [editingItemDesc, setEditingItemDesc] = useState('')

  // Classes
  const [newClassName, setNewClassName] = useState('')
  const [newClassLevel, setNewClassLevel] = useState<number>(1)
  const [newClassText, setNewClassText] = useState('')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [editingClassSlug, setEditingClassSlug] = useState<string | null>(null)
  const [editingClassName, setEditingClassName] = useState('')
  const [editingClassLevel, setEditingClassLevel] = useState<number>(1)
  const [newClassResourceSlug, setNewClassResourceSlug] = useState('')
  const [newClassResourceType, setNewClassResourceType] = useState('')
  const [newClassResourceDefault, setNewClassResourceDefault] = useState<number>(0)
  const [newClassResourceBehavior, setNewClassResourceBehavior] = useState<'fixed' | 'scalable'>('fixed')

  // Groupes
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupText, setNewGroupText] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [editingGroupSlug, setEditingGroupSlug] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  // Navigation
  const [activeTab, setActiveTab] = useState<'jdr' | 'stats' | 'traits' | 'ressources' | 'objets' | 'classes' | 'groupes' | 'personnages'>('jdr')

  // Personnages
  const [newCharacterName, setNewCharacterName] = useState('')
  const [newCharacterClassSlug, setNewCharacterClassSlug] = useState('')
  const [newCharacterGroupSlug, setNewCharacterGroupSlug] = useState('')
  const [newCharacterText, setNewCharacterText] = useState('')

  useEffect(() => {
    if (!jdrSlug) return
    const fetchJdr = async () => {
      try {
        setLoading(true)
        const data = await JdrApiClient.findOneBySlug(jdrSlug)
        setJdr(data)
        setJdrName(data.name)
        setJdrText(data.text)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchJdr()
  }, [jdrSlug])

  const upd = (updated: JdrDto) => setJdr(updated)
  const err = (e: unknown) => alert('Erreur: ' + (e as Error).message)

  const handleUpdateJdr = async () => {
    if (!jdrSlug) return
    try {
      upd(await JdrApiClient.updateJdr(jdrSlug, jdrName || undefined, jdrText || undefined))
    } catch (e) {
      err(e)
    }
  }

  const handleAddStat = async () => {
    if (!jdrSlug || !newStatName) return
    try {
      upd(await JdrApiClient.addStat(jdrSlug, newStatName))
      setNewStatName('')
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveStat = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer cette stat ?')) return
    try {
      upd(await JdrApiClient.removeStat(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  const handleUpdateStat = async (slug: string) => {
    if (!jdrSlug || !editingStatName.trim()) return
    try {
      upd(await JdrApiClient.updateStat(jdrSlug, slug, editingStatName.trim()))
      setEditingStatSlug(null)
      setEditingStatName('')
    } catch (e) {
      err(e)
    }
  }

  const handleAddTrait = async () => {
    if (!jdrSlug || !newTraitName) return
    try {
      const mods = Object.entries(traitModifiers)
        .filter(([, v]) => v !== 0)
        .map(([statSlug, value]) => ({ statSlug, value }))
      upd(await JdrApiClient.addTrait(jdrSlug, newTraitName, newTraitType, mods.length > 0 ? mods : undefined))
      setNewTraitName('')
      setTraitModifiers({})
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveTrait = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer ce trait ?')) return
    try {
      upd(await JdrApiClient.removeTrait(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  const handleUpdateTrait = async (slug: string) => {
    if (!jdrSlug) return
    try {
      const mods = Object.entries(editingTraitModifiers)
        .filter(([, v]) => v !== 0)
        .map(([statSlug, value]) => ({ statSlug, value }))
      upd(await JdrApiClient.updateTrait(jdrSlug, slug, { name: editingTraitName || undefined, type: editingTraitType || undefined, modifiers: mods }))
      setEditingTraitSlug(null)
    } catch (e) {
      err(e)
    }
  }

  const startEditTrait = (t: { slug: string; name: string; type: string; modifiers: Array<{ statSlug: string; value: number }> }) => {
    setEditingTraitSlug(t.slug)
    setEditingTraitName(t.name)
    setEditingTraitType(t.type)
    const modMap: Record<string, number> = {}
    t.modifiers.forEach(m => { modMap[m.statSlug] = m.value })
    setEditingTraitModifiers(modMap)
  }

  const handleAddResource = async () => {
    if (!jdrSlug || !newResourceName) return
    try {
      upd(await JdrApiClient.addResource(jdrSlug, newResourceName, newResourceType))
      setNewResourceName('')
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveResource = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer cette ressource ?')) return
    try {
      upd(await JdrApiClient.removeResource(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  const handleUpdateResource = async (slug: string) => {
    if (!jdrSlug) return
    try {
      upd(await JdrApiClient.updateResource(jdrSlug, slug, { name: editingResourceName || undefined, type: editingResourceType || undefined }))
      setEditingResourceSlug(null)
    } catch (e) {
      err(e)
    }
  }

  const handleAddItem = async () => {
    if (!jdrSlug || !newItemName) return
    try {
      upd(await JdrApiClient.addItem(jdrSlug, newItemName, newItemDesc || undefined, newItemUnique, undefined))
      setNewItemName('')
      setNewItemDesc('')
      setNewItemUnique(false)
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveItem = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer cet objet ?')) return
    try {
      upd(await JdrApiClient.removeItem(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  const handleUpdateItem = async (slug: string) => {
    if (!jdrSlug) return
    try {
      upd(await JdrApiClient.updateItem(jdrSlug, slug, { name: editingItemName || undefined, description: editingItemDesc }))
      setEditingItemSlug(null)
    } catch (e) {
      err(e)
    }
  }

  const handleAddClass = async () => {
    if (!jdrSlug || !newClassName) return
    try {
      upd(await JdrApiClient.addClass(jdrSlug, newClassName, newClassLevel, newClassText || undefined))
      setNewClassName('')
      setNewClassLevel(1)
      setNewClassText('')
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveClass = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer cette classe ? Les personnages perdront leur classe.')) return
    try {
      upd(await JdrApiClient.removeClass(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  const handleUpdateClass = async (slug: string) => {
    if (!jdrSlug || !editingClassName.trim()) return
    try {
      upd(await JdrApiClient.updateClass(jdrSlug, slug, { name: editingClassName.trim(), level: editingClassLevel }))
      setEditingClassSlug(null)
    } catch (e) {
      err(e)
    }
  }

  const handleAddClassResource = async (classSlug: string) => {
    if (!jdrSlug || !newClassResourceSlug) return
    try {
      upd(await JdrApiClient.addClassResource(jdrSlug, classSlug, newClassResourceSlug, newClassResourceType || newClassResourceSlug, newClassResourceDefault, newClassResourceBehavior))
      setNewClassResourceSlug('')
      setNewClassResourceType('')
      setNewClassResourceDefault(0)
      setNewClassResourceBehavior('fixed')
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveClassResource = async (classSlug: string, resourceSlug: string) => {
    if (!jdrSlug || !confirm('Supprimer cette ressource de classe ?')) return
    try {
      upd(await JdrApiClient.removeClassResource(jdrSlug, classSlug, resourceSlug))
    } catch (e) {
      err(e)
    }
  }

  const handleAddGroupMember = async (groupSlug: string, characterSlug: string) => {
    if (!jdrSlug) return
    try {
      upd(await JdrApiClient.addCharacterGroup(jdrSlug, characterSlug, groupSlug))
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveGroupMember = async (groupSlug: string, characterSlug: string) => {
    if (!jdrSlug) return
    try {
      upd(await JdrApiClient.removeCharacterGroup(jdrSlug, characterSlug, groupSlug))
    } catch (e) {
      err(e)
    }
  }

  const handleAddGroup = async () => {
    if (!jdrSlug || !newGroupName) return
    try {
      upd(await JdrApiClient.addGroup(jdrSlug, newGroupName, newGroupText || undefined))
      setNewGroupName('')
      setNewGroupText('')
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveGroup = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer ce groupe ? Les personnages perdront leur groupe.')) return
    try {
      upd(await JdrApiClient.removeGroup(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  const handleUpdateGroup = async (slug: string) => {
    if (!jdrSlug || !editingGroupName.trim()) return
    try {
      upd(await JdrApiClient.updateGroup(jdrSlug, slug, { name: editingGroupName.trim() }))
      setEditingGroupSlug(null)
    } catch (e) {
      err(e)
    }
  }

  const handleAddCharacter = async () => {
    if (!jdrSlug || !newCharacterName) return
    try {
      const updated = await JdrApiClient.addCharacter(
        jdrSlug,
        newCharacterName,
        newCharacterClassSlug || undefined,
        newCharacterText
      )
      const addedChar = updated.characters.find(c => c.name === newCharacterName)
      let finalJdr = updated
      if (addedChar && newCharacterGroupSlug) {
        finalJdr = await JdrApiClient.addCharacterGroup(jdrSlug, addedChar.slug, newCharacterGroupSlug)
      }
      upd(finalJdr)
      setNewCharacterName('')
      setNewCharacterClassSlug('')
      setNewCharacterGroupSlug('')
      setNewCharacterText('')
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveCharacter = async (slug: string) => {
    if (!jdrSlug || !confirm('Supprimer ce personnage ?')) return
    try {
      upd(await JdrApiClient.removeCharacter(jdrSlug, slug))
    } catch (e) {
      err(e)
    }
  }

  if (loading) return <div style={styles.container}>Chargement...</div>
  if (error) return <div style={styles.container}>Erreur: {error}</div>
  if (!jdr) return <div style={styles.container}>JdR non trouve</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Configuration: {jdr.name}</h1>
        <button onClick={() => navigate(`/jdr/${jdrSlug}/mj`)}>Retour</button>
      </div>

      <div style={styles.tabs}>
        {(['jdr', 'stats', 'traits', 'ressources', 'objets', 'classes', 'groupes', 'personnages'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
          >
            {tab === 'jdr' ? 'JdR' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.sections}>
        {activeTab === 'jdr' && <section style={styles.section}>
          <h2>Informations JdR</h2>
          <p style={styles.hint}>Nom et description de la partie. Ces informations apparaissent sur la page d'accueil du JdR.</p>
          <div style={styles.formRow}>
            <input value={jdrName} onChange={e => setJdrName(e.target.value)} placeholder="Nom" />
            <textarea value={jdrText} onChange={e => setJdrText(e.target.value)} rows={2} placeholder="Description" />
            <button onClick={handleUpdateJdr}>Enregistrer</button>
          </div>
        </section>}

        {activeTab === 'stats' && <section style={styles.section}>
          <h2>Stats ({jdr.stats.length})</h2>
          <p style={styles.hint}>Les stats sont les attributs numériques des personnages (ex : Force, Intelligence, Agilité). Chaque stat peut recevoir des modificateurs via les traits. Sur la page MJ, cliquer sur une stat d'un personnage déclenche un jet de dé avec cette stat. Un X grisé signifie que la stat est utilisée dans un modificateur de trait — supprimez d'abord le trait concerné.</p>
          <div style={styles.list}>
            {jdr.stats.map(s => (
              <div key={s.slug} style={styles.listItem}>
                {editingStatSlug === s.slug ? (
                  <>
                    <input value={editingStatName} onChange={e => setEditingStatName(e.target.value)} style={{ flex: 1 }} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleUpdateStat(s.slug); if (e.key === 'Escape') setEditingStatSlug(null) }} />
                    <button onClick={() => handleUpdateStat(s.slug)}>✓</button>
                    <button onClick={() => setEditingStatSlug(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span>{s.name} <small style={styles.slug}>({s.slug})</small></span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => { setEditingStatSlug(s.slug); setEditingStatName(s.name) }} style={{ fontSize: '0.75rem' }}>✎</button>
                      <button
                        onClick={() => handleRemoveStat(s.slug)}
                        style={styles.dangerBtn}
                        disabled={jdr.traits.some(t => t.modifiers.some(m => m.statSlug === s.slug))}
                        title={jdr.traits.some(t => t.modifiers.some(m => m.statSlug === s.slug)) ? 'Utilisé par un trait' : ''}
                      >X</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={styles.formRow}>
            <input placeholder="Nom de la stat" value={newStatName} onChange={e => setNewStatName(e.target.value)} />
            <button onClick={handleAddStat}>Ajouter stat</button>
          </div>
        </section>}

        {activeTab === 'traits' && <section style={styles.section}>
          <h2>Traits ({jdr.traits.length})</h2>
          <p style={styles.hint}>Les traits sont des caractéristiques qualitatives assignables aux personnages depuis leur fiche. Chaque trait peut modifier une ou plusieurs stats (bonus ou malus). Les types permettent de les organiser : <strong>Normal</strong> (trait standard), <strong>Defaut</strong> (défaut ou faiblesse), <strong>Sorts</strong> (magie ou compétences actives), <strong>Objet</strong> (lié à un équipement), <strong>Secret</strong> (visible uniquement du MJ). Le symbole ★ indique qu'au moins un personnage possède ce trait — impossible de le supprimer tant qu'il est attribué.</p>
          {(['Normal', 'Defaut', 'Sorts', 'Objet', 'Secret'] as const).map(typeGroup => {
            const group = jdr.traits.filter(t => t.type === typeGroup)
            if (group.length === 0) return null
            return (
              <div key={typeGroup} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{typeGroup}</h3>
                <div style={styles.list}>
                  {group.map(t => {
                    const isEditing = editingTraitSlug === t.slug
                    const isOwnedByChar = jdr.characters.some(c => c.traitSlugs.includes(t.slug))
                    return (
                      <div key={t.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <input value={editingTraitName} onChange={e => setEditingTraitName(e.target.value)} placeholder="Nom" style={{ flex: 1 }} autoFocus />
                              <select value={editingTraitType} onChange={e => setEditingTraitType(e.target.value)}>
                                <option>Normal</option>
                                <option>Defaut</option>
                                <option>Objet</option>
                                <option>Secret</option>
                                <option>Sorts</option>
                              </select>
                              <button onClick={() => handleUpdateTrait(t.slug)}>✓</button>
                              <button onClick={() => setEditingTraitSlug(null)}>✕</button>
                            </div>
                            {jdr.stats.length > 0 && (
                              <div style={{ padding: '0.5rem', background: 'var(--color-bg)', borderRadius: '0.375rem' }}>
                                <small style={styles.slug}>Modificateurs (0 = ignoré):</small>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  {jdr.stats.map(s => (
                                    <label key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                                      {s.name}:
                                      <input type="number" style={{ width: '4rem' }} value={editingTraitModifiers[s.slug] ?? 0} onChange={e => setEditingTraitModifiers(prev => ({ ...prev, [s.slug]: parseInt(e.target.value, 10) || 0 }))} />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                              {t.name}
                              {t.modifiers.length > 0 && (
                                <small style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>
                                  [{t.modifiers.map(m => `${m.statSlug}:${m.value >= 0 ? '+' : ''}${m.value}`).join(', ')}]
                                </small>
                              )}
                              {isOwnedByChar && <small style={{ marginLeft: '0.5rem', color: 'var(--color-secondary)' }}>★</small>}
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button onClick={() => startEditTrait(t)} style={{ fontSize: '0.75rem' }}>✎</button>
                              <button onClick={() => handleRemoveTrait(t.slug)} style={styles.dangerBtn} disabled={isOwnedByChar} title={isOwnedByChar ? 'Utilisé par un perso' : ''}>X</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div style={{ ...styles.formRow, flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={styles.formRow}>
              <input placeholder="Nom du trait" value={newTraitName} onChange={e => setNewTraitName(e.target.value)} />
              <select value={newTraitType} onChange={e => setNewTraitType(e.target.value)}>
                <option>Normal</option>
                <option>Defaut</option>
                <option>Objet</option>
                <option>Secret</option>
                <option>Sorts</option>
              </select>
            </div>
            {jdr.stats.length > 0 && (
              <div style={{ padding: '0.5rem', background: 'var(--color-bg)', borderRadius: '0.375rem' }}>
                <small style={styles.slug}>Modificateurs par stat (laisser 0 pour ignorer):</small>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {jdr.stats.map(s => (
                    <label key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                      {s.name}:
                      <input
                        type="number"
                        style={{ width: '4rem' }}
                        value={traitModifiers[s.slug] ?? 0}
                        onChange={e => setTraitModifiers(prev => ({ ...prev, [s.slug]: parseInt(e.target.value, 10) || 0 }))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleAddTrait} style={{ alignSelf: 'flex-start' }}>Ajouter trait</button>
          </div>
        </section>}

        {activeTab === 'ressources' && <section style={styles.section}>
          <h2>Ressources ({jdr.resources.length})</h2>
          <p style={styles.hint}>Les ressources sont des compteurs associés aux personnages (ex : Points de Vie, Mana, Points d'Action). Le type détermine leur portée : <strong>all</strong> = tous les personnages ont cette ressource, <strong>specific</strong> = seulement certains (assignée via la classe), <strong>group</strong> = partagée au niveau d'un groupe. Les ressources sont ensuite configurées par classe (valeur par défaut, mode de progression).</p>
          <div style={styles.list}>
            {jdr.resources.map(r => (
              <div key={r.slug} style={styles.listItem}>
                {editingResourceSlug === r.slug ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                    <input value={editingResourceName} onChange={e => setEditingResourceName(e.target.value)} placeholder="Nom" style={{ flex: 1 }} autoFocus />
                    <select value={editingResourceType} onChange={e => setEditingResourceType(e.target.value)}>
                      <option value="all">all</option>
                      <option value="specific">specific</option>
                      <option value="group">group</option>
                    </select>
                    <button onClick={() => handleUpdateResource(r.slug)}>✓</button>
                    <button onClick={() => setEditingResourceSlug(null)}>✕</button>
                  </div>
                ) : (
                  <>
                    <span>{r.name} <small style={styles.slug}>({r.type})</small></span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => { setEditingResourceSlug(r.slug); setEditingResourceName(r.name); setEditingResourceType(r.type) }} style={{ fontSize: '0.75rem' }}>✎</button>
                      <button onClick={() => handleRemoveResource(r.slug)} style={styles.dangerBtn}>X</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={styles.formRow}>
            <input placeholder="Nom de la ressource" value={newResourceName} onChange={e => setNewResourceName(e.target.value)} />
            <select value={newResourceType} onChange={e => setNewResourceType(e.target.value)}>
              <option value="all">all (tous les persos)</option>
              <option value="specific">specific (optionnel)</option>
              <option value="group">group (niveau groupe)</option>
            </select>
            <button onClick={handleAddResource}>Ajouter ressource</button>
          </div>
        </section>}

        {activeTab === 'objets' && <section style={styles.section}>
          <h2>Catalogue d'objets ({jdr.items.length})</h2>
          <p style={styles.hint}>Le catalogue regroupe tous les objets pouvant être distribués aux personnages depuis leur fiche. Un objet <strong>unique</strong> ne peut être détenu que par un seul personnage à la fois. Les objets sont réutilisables entre les parties du même JdR.</p>
          <div style={styles.list}>
            {jdr.items.map(i => (
              <div key={i.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.25rem' }}>
                {editingItemSlug === i.slug ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input value={editingItemName} onChange={e => setEditingItemName(e.target.value)} placeholder="Nom" style={{ flex: 1 }} autoFocus />
                    <input value={editingItemDesc} onChange={e => setEditingItemDesc(e.target.value)} placeholder="Description" style={{ flex: 2 }} />
                    <button onClick={() => handleUpdateItem(i.slug)}>✓</button>
                    <button onClick={() => setEditingItemSlug(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{i.name}{i.unique ? ' [unique]' : ''} <small style={styles.slug}>{i.description}</small></span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => { setEditingItemSlug(i.slug); setEditingItemName(i.name); setEditingItemDesc(i.description) }} style={{ fontSize: '0.75rem' }}>✎</button>
                      <button onClick={() => handleRemoveItem(i.slug)} style={styles.dangerBtn}>X</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={styles.formRow}>
            <input placeholder="Nom de l'objet" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            <input placeholder="Description" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="checkbox" checked={newItemUnique} onChange={e => setNewItemUnique(e.target.checked)} /> Unique
            </label>
            <button onClick={handleAddItem}>Ajouter objet</button>
          </div>
        </section>}

        {activeTab === 'classes' && <section style={styles.section}>
          <h2>Classes ({jdr.classes.length})</h2>
          <p style={styles.hint}>Les classes définissent l'archétype d'un personnage (ex : Guerrier, Mage, Roublard). Chaque classe peut embarquer des ressources spécifiques avec une valeur par défaut et un mode de progression : <strong>fixed</strong> = valeur constante, <strong>scalable</strong> = évolue avec le niveau du personnage. Le niveau propre à chaque personnage (<em>Niv.</em>) est géré sur sa fiche, indépendamment de la classe.</p>
          <div style={styles.list}>
            {jdr.classes.map(clazz => (
              <div key={clazz.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {editingClassSlug === clazz.slug ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                      <input value={editingClassName} onChange={e => setEditingClassName(e.target.value)} placeholder="Nom" style={{ flex: 1 }} autoFocus />
                      <input type="number" min={1} value={editingClassLevel} onChange={e => setEditingClassLevel(parseInt(e.target.value, 10) || 1)} style={{ width: '5rem' }} />
                      <button onClick={() => handleUpdateClass(clazz.slug)}>✓</button>
                      <button onClick={() => setEditingClassSlug(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span>{clazz.name}
                        {clazz.resources.length > 0 && (
                          <small style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>
                            [{clazz.resources.map(r => r.resourceSlug).join(', ')}]
                          </small>
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => { setEditingClassSlug(clazz.slug); setEditingClassName(clazz.name); setEditingClassLevel(clazz.level) }} style={{ fontSize: '0.75rem' }}>✎</button>
                        <button onClick={() => setExpandedClass(expandedClass === clazz.slug ? null : clazz.slug)} style={{ fontSize: '0.75rem' }}>Ressources</button>
                        <button onClick={() => handleRemoveClass(clazz.slug)} style={styles.dangerBtn}>X</button>
                      </div>
                    </>
                  )}
                </div>
                {expandedClass === clazz.slug && (
                  <div style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                    {clazz.resources.map(r => (
                      <div key={r.resourceSlug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span>{r.resourceSlug} — type: {r.resourceType}, défaut: {r.defaultValue}, mode: {r.behavior}</span>
                        <button onClick={() => handleRemoveClassResource(clazz.slug, r.resourceSlug)} style={{ ...styles.dangerBtn, fontSize: '0.75rem' }}>X</button>
                      </div>
                    ))}
                    <div style={{ ...styles.formRow, marginTop: '0.5rem' }}>
                      <input
                        placeholder="Slug ressource"
                        style={{ flex: 1 }}
                        value={newClassResourceSlug}
                        onChange={e => setNewClassResourceSlug(e.target.value)}
                      />
                      <input
                        placeholder="Type"
                        style={{ width: '8rem' }}
                        value={newClassResourceType}
                        onChange={e => setNewClassResourceType(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Défaut"
                        style={{ width: '5rem' }}
                        value={newClassResourceDefault}
                        onChange={e => setNewClassResourceDefault(parseInt(e.target.value, 10) || 0)}
                      />
                      <select value={newClassResourceBehavior} onChange={e => setNewClassResourceBehavior(e.target.value as 'fixed' | 'scalable')}>
                        <option value="fixed">fixed</option>
                        <option value="scalable">scalable</option>
                      </select>
                      <button onClick={() => handleAddClassResource(clazz.slug)}>Ajouter</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={styles.formRow}>
            <input placeholder="Nom de classe" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
            <input type="number" min={1} value={newClassLevel} onChange={e => setNewClassLevel(e.target.value ? parseInt(e.target.value, 10) : 1)} />
            <input placeholder="Description" value={newClassText} onChange={e => setNewClassText(e.target.value)} />
            <button onClick={handleAddClass}>Ajouter classe</button>
          </div>
        </section>}

        {activeTab === 'groupes' && <section style={styles.section}>
          <h2>Groupes ({jdr.groups.length})</h2>
          <p style={styles.hint}>Les groupes permettent d'organiser les personnages en équipes, factions ou familles. Un personnage peut appartenir à plusieurs groupes. Sur la page MJ, les personnages sont affichés par groupe.</p>
          <div style={styles.list}>
            {jdr.groups.map(group => {
              const members = jdr.characters.filter(c => c.groupSlugs.includes(group.slug))
              const nonMembers = jdr.characters.filter(c => !c.groupSlugs.includes(group.slug))
              return (
                <div key={group.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {editingGroupSlug === group.slug ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                        <input value={editingGroupName} onChange={e => setEditingGroupName(e.target.value)} placeholder="Nom" style={{ flex: 1 }} autoFocus />
                        <button onClick={() => handleUpdateGroup(group.slug)}>✓</button>
                        <button onClick={() => setEditingGroupSlug(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <span>{group.name}
                          <small style={{ marginLeft: '0.5rem', ...styles.slug }}>({members.length} membre{members.length !== 1 ? 's' : ''})</small>
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => { setEditingGroupSlug(group.slug); setEditingGroupName(group.name) }} style={{ fontSize: '0.75rem' }}>✎</button>
                          <button onClick={() => setExpandedGroup(expandedGroup === group.slug ? null : group.slug)} style={{ fontSize: '0.75rem' }}>Membres</button>
                          <button onClick={() => handleRemoveGroup(group.slug)} style={styles.dangerBtn}>X</button>
                        </div>
                      </>
                    )}
                  </div>
                  {expandedGroup === group.slug && (
                    <div style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                      {members.length === 0 && <div style={{ color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>Aucun membre</div>}
                      {members.map(c => (
                        <div key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span>{c.name}</span>
                          <button onClick={() => handleRemoveGroupMember(group.slug, c.slug)} style={{ ...styles.dangerBtn, fontSize: '0.75rem' }}>Retirer</button>
                        </div>
                      ))}
                      {nonMembers.length > 0 && (
                        <div style={{ ...styles.formRow, marginTop: '0.5rem' }}>
                          <select defaultValue="" onChange={e => { if (e.target.value) handleAddGroupMember(group.slug, e.target.value); e.target.value = '' }}>
                            <option value="">Ajouter un membre...</option>
                            {nonMembers.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={styles.formRow}>
            <input placeholder="Nom du groupe" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <input placeholder="Description" value={newGroupText} onChange={e => setNewGroupText(e.target.value)} />
            <button onClick={handleAddGroup}>Ajouter groupe</button>
          </div>
        </section>}

        {activeTab === 'personnages' && <section style={styles.section}>
          <h2>Personnages ({jdr.characters.length})</h2>
          <p style={styles.hint}>Liste de tous les personnages du JdR. Cliquez sur <strong>Voir</strong> pour accéder à la fiche complète d'un personnage (stats, ressources, traits, objets, niveau). Les personnages jouables sont visibles sur la page MJ et peuvent y lancer des dés. Les personnages non jouables (PNJ) peuvent être créés sans classe.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {jdr.characters.map(c => {
              const clazz = c.classSlug ? jdr.classes.find(v => v.slug === c.classSlug) : undefined
              const groups = jdr.groups.filter(v => c.groupSlugs.includes(v.slug))
              return (
                <div key={c.slug} style={{ ...styles.listItem, flexDirection: 'column' as const, alignItems: 'flex-start' as const, gap: '0.4rem' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary)' }}>
                    {clazz ? `${clazz.name}${c.classLevel > 1 ? ` Niv.${c.classLevel}` : ''}` : 'Sans classe'}
                    {groups.length > 0 ? ` · ${groups.map(g => g.name).join(', ')}` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => navigate(`/jdr/${jdrSlug}/characters/${c.slug}`)}>Voir</button>
                    <button onClick={() => navigate(`/jdr/${jdrSlug}/characters/${c.slug}/edit`)}>Éditer</button>
                    <button onClick={() => handleRemoveCharacter(c.slug)} style={styles.dangerBtn}>X</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={styles.formRow}>
            <input placeholder="Nom" value={newCharacterName} onChange={e => setNewCharacterName(e.target.value)} />
            <select value={newCharacterClassSlug} onChange={e => setNewCharacterClassSlug(e.target.value)}>
              <option value="">Classe: aucune</option>
              {jdr.classes.map(clazz => (
                <option key={clazz.slug} value={clazz.slug}>{clazz.name}</option>
              ))}
            </select>
            <select value={newCharacterGroupSlug} onChange={e => setNewCharacterGroupSlug(e.target.value)}>
              <option value="">Groupe: aucun</option>
              {jdr.groups.map(group => (
                <option key={group.slug} value={group.slug}>{group.name}</option>
              ))}
            </select>
            <input placeholder="Description" value={newCharacterText} onChange={e => setNewCharacterText(e.target.value)} />
            <button onClick={handleAddCharacter}>Ajouter perso</button>
          </div>
        </section>}
      </div>
    </div>
  )
}

const styles = {
  container: { padding: '1.5rem', maxWidth: '900px', margin: '0 auto' },
  tabs: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: '0.25rem',
    marginBottom: '1.5rem',
    borderBottom: '2px solid var(--color-border)',
    paddingBottom: '0.5rem'
  },
  tabBtn: {
    padding: '0.4rem 0.9rem',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: '0.375rem 0.375rem 0 0',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  tabBtnActive: {
    background: 'white',
    borderBottom: '2px solid white',
    marginBottom: '-2px',
    fontWeight: 600
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '2rem'
  },
  sections: { display: 'flex' as const, flexDirection: 'column' as const, gap: '2rem' },
  section: {
    padding: '1.5rem',
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)'
  },
  formRow: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    alignItems: 'center' as const
  },
  list: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  listItem: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '0.5rem 0.75rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem'
  },
  draftComposer: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem'
  },
  draftColumn: {
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '1rem',
    background: 'var(--color-bg-secondary)'
  },
  draftListWrap: {
    display: 'grid' as const,
    gap: '0.5rem',
    width: '100%'
  },
  draftListItem: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    background: 'var(--color-bg)'
  },
  traitList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem',
    maxHeight: '55vh',
    overflow: 'auto'
  },
  traitItem: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem'
  },
  emptyState: {
    padding: '0.75rem',
    color: 'var(--color-secondary)',
    fontStyle: 'italic'
  },
  slug: { color: 'var(--color-secondary)', fontSize: '0.8rem' },
  dangerBtn: { background: 'var(--color-danger)' as string, minWidth: '2rem' },
  hint: { color: 'var(--color-secondary)', fontSize: '0.85rem', margin: '0 0 1rem 0', lineHeight: '1.5' }
}
