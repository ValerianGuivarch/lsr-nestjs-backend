import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DraftDto, JdrApiClient, JdrDto, TraitDto } from '../data/JdrApiClient'

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

  // Traits
  const [newTraitName, setNewTraitName] = useState('')
  const [newTraitType, setNewTraitType] = useState('Normal')
  const [traitModifiers, setTraitModifiers] = useState<Record<string, number>>({})
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null)

  // Ressources
  const [newResourceName, setNewResourceName] = useState('')
  const [newResourceType, setNewResourceType] = useState('all')

  // Objets
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemUnique, setNewItemUnique] = useState(false)

  // Classes
  const [newClassName, setNewClassName] = useState('')
  const [newClassLevel, setNewClassLevel] = useState<number>(1)
  const [newClassText, setNewClassText] = useState('')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [newClassResourceSlug, setNewClassResourceSlug] = useState('')
  const [newClassResourceType, setNewClassResourceType] = useState('')
  const [newClassResourceDefault, setNewClassResourceDefault] = useState<number>(0)
  const [newClassResourceBehavior, setNewClassResourceBehavior] = useState<'fixed' | 'scalable'>('fixed')

  // Groupes
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupText, setNewGroupText] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // Navigation
  const [activeTab, setActiveTab] = useState<'jdr' | 'stats' | 'traits' | 'ressources' | 'objets' | 'classes' | 'groupes' | 'personnages' | 'draft'>('jdr')

  // Draft
  const [drafts, setDrafts] = useState<DraftDto[]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftGroupSlug, setDraftGroupSlug] = useState('')
  const [draftRounds, setDraftRounds] = useState(2)
  const [selectedDraftTraits, setSelectedDraftTraits] = useState<string[]>([])
  const [selectedDraftTraitType, setSelectedDraftTraitType] = useState('all')

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
        const [data, fetchedDrafts] = await Promise.all([
          JdrApiClient.findOneBySlug(jdrSlug),
          JdrApiClient.getDrafts(jdrSlug)
        ])
        setJdr(data)
        setDrafts(fetchedDrafts)
        const pendingDraft = fetchedDrafts.find((draft) => draft.status === 'pending') ?? null
        const activeDraft = fetchedDrafts.find((draft) => draft.status === 'active') ?? null
        setDraftId(pendingDraft?.id ?? null)
        if (pendingDraft) {
          setDraftName(pendingDraft.name)
          setDraftGroupSlug(pendingDraft.groupSlug)
          setDraftRounds(pendingDraft.totalRounds)
          setSelectedDraftTraits(pendingDraft.selectedTraitSlugs)
        }
        if (!pendingDraft) {
          setDraftName('')
          setSelectedDraftTraits([])
        }
        if (!draftGroupSlug && data.groups.length > 0 && !pendingDraft) {
          setDraftGroupSlug(data.groups[0].slug)
        }
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
      upd(await JdrApiClient.updateCharacter(jdrSlug, characterSlug, undefined, undefined, groupSlug))
    } catch (e) {
      err(e)
    }
  }

  const handleRemoveGroupMember = async (characterSlug: string) => {
    if (!jdrSlug) return
    try {
      upd(await JdrApiClient.updateCharacter(jdrSlug, characterSlug, undefined, undefined, ''))
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

  const handleAddCharacter = async () => {
    if (!jdrSlug || !newCharacterName) return
    try {
      upd(await JdrApiClient.addCharacter(
        jdrSlug,
        newCharacterName,
        newCharacterClassSlug || undefined,
        newCharacterGroupSlug || undefined,
        newCharacterText
      ))
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

  const allDraftTraits = useMemo(() => jdr?.traits ?? [], [jdr])

  const selectedDraftTraitSet = useMemo(() => new Set(selectedDraftTraits), [selectedDraftTraits])

  const availableDraftTraits = useMemo(
    () => allDraftTraits.filter((trait) => !selectedDraftTraitSet.has(trait.slug)),
    [allDraftTraits, selectedDraftTraitSet]
  )

  const filteredAvailableDraftTraits = useMemo(
    () => availableDraftTraits.filter((trait) => selectedDraftTraitType === 'all' || trait.type === selectedDraftTraitType),
    [availableDraftTraits, selectedDraftTraitType]
  )

  const selectedDraftTraitDtos = useMemo(
    () => selectedDraftTraits.map((slug) => allDraftTraits.find((trait) => trait.slug === slug)).filter((trait): trait is TraitDto => Boolean(trait)),
    [allDraftTraits, selectedDraftTraits]
  )

  const addTraitToDraft = (traitSlug: string) => {
    setSelectedDraftTraits((previous) => {
      const next = previous.includes(traitSlug) ? previous : [...previous, traitSlug]
      if (draftId && jdrSlug) {
        JdrApiClient.updateDraft(jdrSlug, draftId, {
          groupSlug: draftGroupSlug,
          rounds: draftRounds,
          traitSlugs: next
        }).catch(err)
      }
      return next
    })
  }

  const removeTraitFromDraft = (traitSlug: string) => {
    setSelectedDraftTraits((previous) => {
      const next = previous.filter((slug) => slug !== traitSlug)
      if (draftId && jdrSlug) {
        JdrApiClient.updateDraft(jdrSlug, draftId, {
          groupSlug: draftGroupSlug,
          rounds: draftRounds,
          traitSlugs: next
        }).catch(err)
      }
      return next
    })
  }

  const createOrSaveDraft = async () => {
    if (!jdrSlug || !draftGroupSlug || !draftName.trim()) {
      alert('Donne un nom au template de draft.')
      return
    }
    try {
      if (draftId) {
        const updated = await JdrApiClient.updateDraft(jdrSlug, draftId, {
          name: draftName,
          groupSlug: draftGroupSlug,
          rounds: draftRounds,
          traitSlugs: selectedDraftTraits,
          traitType: 'Manuel'
        })
        setDrafts((previous) => previous.map((draft) => (draft.id === updated.id ? updated : draft)))
      } else {
        const created = await JdrApiClient.createDraft(jdrSlug, draftGroupSlug, draftRounds, {
          name: draftName,
          traitSlugs: selectedDraftTraits,
          traitType: 'Manuel'
        })
        setDraftId(created.id)
        setDrafts((previous) => [created, ...previous])
      }
    } catch (e) {
      err(e)
    }
  }

  const launchDraft = async (targetDraftId = draftId) => {
    if (!jdrSlug || !targetDraftId) return
    try {
      const launched = await JdrApiClient.launchDraft(jdrSlug, targetDraftId)
      setDrafts((previous) => previous.map((draft) => (draft.id === launched.id ? launched : draft)))
      setDraftId(null)
    } catch (e) {
      err(e)
    }
  }

  const closeActiveDraft = async () => {
    if (!jdrSlug || !confirm('Arrêter le draft actif ?')) return
    try {
      await JdrApiClient.closeDraft(jdrSlug)
      setDrafts((previous) => previous.filter((draft) => draft.status !== 'active'))
    } catch (e) {
      err(e)
    }
  }

  const activeDraft = drafts.find((draft) => draft.status === 'active') ?? null
  const pendingDraft = drafts.find((draft) => draft.status === 'pending') ?? null

  const selectDraftForEdition = (draft: DraftDto) => {
    setDraftId(draft.id)
    setDraftName(draft.name)
    setDraftGroupSlug(draft.groupSlug)
    setDraftRounds(draft.totalRounds)
    setSelectedDraftTraits(draft.selectedTraitSlugs)
  }

  const deleteDraft = async (draft: DraftDto) => {
    if (!jdrSlug || !confirm(`Supprimer le template "${draft.name}" ?`)) return
    try {
      await JdrApiClient.deleteDraft(jdrSlug, draft.id)
      setDrafts((previous) => previous.filter((candidate) => candidate.id !== draft.id))
      if (draftId === draft.id) {
        setDraftId(null)
        setDraftName('')
        setSelectedDraftTraits([])
      }
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
        {(['jdr', 'stats', 'traits', 'ressources', 'objets', 'classes', 'groupes', 'personnages', 'draft'] as const).map(tab => (
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
          <div style={styles.formRow}>
            <input value={jdrName} onChange={e => setJdrName(e.target.value)} placeholder="Nom" />
            <textarea value={jdrText} onChange={e => setJdrText(e.target.value)} rows={2} placeholder="Description" />
            <button onClick={handleUpdateJdr}>Enregistrer</button>
          </div>
        </section>}

        {activeTab === 'stats' && <section style={styles.section}>
          <h2>Stats ({jdr.stats.length})</h2>
          <div style={styles.list}>
            {jdr.stats.map(s => (
              <div key={s.slug} style={styles.listItem}>
                <span>{s.name} <small style={styles.slug}>({s.slug})</small></span>
                <button onClick={() => handleRemoveStat(s.slug)} style={styles.dangerBtn}>X</button>
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
          <div style={styles.list}>
            {jdr.traits.map(t => (
              <div key={t.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {t.name} <small style={styles.slug}>({t.type})</small>
                    {t.modifiers.length > 0 && (
                      <small style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>
                        [{t.modifiers.map(m => `${m.statSlug}:${m.value >= 0 ? '+' : ''}${m.value}`).join(', ')}]
                      </small>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setExpandedTrait(expandedTrait === t.slug ? null : t.slug)} style={{ fontSize: '0.75rem' }}>Modifiers</button>
                    <button onClick={() => handleRemoveTrait(t.slug)} style={styles.dangerBtn}>X</button>
                  </div>
                </div>
                {expandedTrait === t.slug && (
                  <div style={{ paddingLeft: '1rem', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                    <em>Les modifiers sont définis à la création du trait. Pour modifier, supprimez et recréez le trait.</em>
                    {t.modifiers.map(m => (
                      <div key={m.statSlug}>{m.statSlug}: {m.value >= 0 ? '+' : ''}{m.value}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ ...styles.formRow, flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={styles.formRow}>
              <input placeholder="Nom du trait" value={newTraitName} onChange={e => setNewTraitName(e.target.value)} />
              <select value={newTraitType} onChange={e => setNewTraitType(e.target.value)}>
                <option>Normal</option>
                <option>Defaut</option>
                <option>Objet</option>
                <option>Secret</option>
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
          <div style={styles.list}>
            {jdr.resources.map(r => (
              <div key={r.slug} style={styles.listItem}>
                <span>{r.name} <small style={styles.slug}>({r.type})</small></span>
                <button onClick={() => handleRemoveResource(r.slug)} style={styles.dangerBtn}>X</button>
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
          <div style={styles.list}>
            {jdr.items.map(i => (
              <div key={i.slug} style={styles.listItem}>
                <span>{i.name}{i.unique ? ' [unique]' : ''} <small style={styles.slug}>{i.description}</small></span>
                <button onClick={() => handleRemoveItem(i.slug)} style={styles.dangerBtn}>X</button>
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
          <div style={styles.list}>
            {jdr.classes.map(clazz => (
              <div key={clazz.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{clazz.name} <small style={styles.slug}>(Lvl {clazz.level})</small>
                    {clazz.resources.length > 0 && (
                      <small style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>
                        [{clazz.resources.map(r => r.resourceSlug).join(', ')}]
                      </small>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setExpandedClass(expandedClass === clazz.slug ? null : clazz.slug)} style={{ fontSize: '0.75rem' }}>Ressources</button>
                    <button onClick={() => handleRemoveClass(clazz.slug)} style={styles.dangerBtn}>X</button>
                  </div>
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
          <div style={styles.list}>
            {jdr.groups.map(group => {
              const members = jdr.characters.filter(c => c.groupSlug === group.slug)
              const nonMembers = jdr.characters.filter(c => !c.groupSlug)
              return (
                <div key={group.slug} style={{ ...styles.listItem, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{group.name}
                      <small style={{ marginLeft: '0.5rem', ...styles.slug }}>({members.length} membre{members.length !== 1 ? 's' : ''})</small>
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => setExpandedGroup(expandedGroup === group.slug ? null : group.slug)} style={{ fontSize: '0.75rem' }}>Membres</button>
                      <button onClick={() => handleRemoveGroup(group.slug)} style={styles.dangerBtn}>X</button>
                    </div>
                  </div>
                  {expandedGroup === group.slug && (
                    <div style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                      {members.length === 0 && <div style={{ color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>Aucun membre</div>}
                      {members.map(c => (
                        <div key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span>{c.name}</span>
                          <button onClick={() => handleRemoveGroupMember(c.slug)} style={{ ...styles.dangerBtn, fontSize: '0.75rem' }}>Retirer</button>
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
          <div style={styles.list}>
            {jdr.characters.map(c => {
              const clazz = c.classSlug ? jdr.classes.find(v => v.slug === c.classSlug) : undefined
              const group = c.groupSlug ? jdr.groups.find(v => v.slug === c.groupSlug) : undefined
              return (
                <div key={c.slug} style={styles.listItem}>
                  <span>
                    {c.name}
                    {clazz ? ` - ${clazz.name} (Lvl ${clazz.level})` : ''}
                    {group ? ` - Groupe ${group.name}` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => navigate(`/jdr/${jdrSlug}/characters/${c.slug}`)}>Voir</button>
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
                <option key={clazz.slug} value={clazz.slug}>{clazz.name} (Lvl {clazz.level})</option>
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

        {activeTab === 'draft' && <section style={styles.section}>
          <h2>Composer un template de draft</h2>

          {activeDraft && (
            <div style={{ ...styles.listItem, alignItems: 'flex-start', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <strong>Draft lancé</strong>
              <span>
                Groupe {activeDraft.groupSlug} · {activeDraft.status} · tour {activeDraft.currentRound}/{activeDraft.totalRounds}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(`/jdr/${jdrSlug}/draft/feed`)}>Voir le feed</button>
                {activeDraft.status === 'active' ? (
                  <button onClick={closeActiveDraft} style={styles.dangerBtn}>Arrêter</button>
                ) : (
                  <span style={styles.slug}>Finalisé</span>
                )}
              </div>
            </div>
          )}

          <div style={{ ...styles.listItem, alignItems: 'flex-start', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <strong>Templates de draft enregistrés</strong>
            <div style={styles.draftListWrap}>
              {drafts.length === 0 && <span style={styles.slug}>Aucun template enregistré.</span>}
              {drafts.map((draft) => (
                <div key={draft.id} style={styles.draftListItem}>
                  <span>
                    <strong>{draft.name}</strong>
                    {' '}· {draft.status === 'pending' ? 'Template' : draft.status === 'active' ? 'Draft lancé' : draft.status}
                    {' '}· groupe {draft.groupSlug} · {draft.selectedTraitSlugs.length} traits · tours {draft.totalRounds}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {draft.status === 'pending' && <button onClick={() => selectDraftForEdition(draft)}>Éditer</button>}
                    {draft.status === 'pending' && <button onClick={() => launchDraft(draft.id)}>Lancer</button>}
                    {draft.status === 'active' && <button onClick={() => navigate(`/jdr/${jdrSlug}/draft/feed`)}>Feed</button>}
                    {draft.status !== 'active' && <button onClick={() => deleteDraft(draft)} style={styles.dangerBtn}>Supprimer</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...styles.formRow, alignItems: 'flex-end', marginBottom: '1rem' }}>
            <label>
              Nom du template
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Ex: Conseil - traits positifs"
              />
            </label>

            <label>
              Groupe des joueurs
              <select value={draftGroupSlug} onChange={(e) => setDraftGroupSlug(e.target.value)}>
                <option value="">--- Choisir un groupe ---</option>
                {jdr.groups.map((group) => (
                  <option key={group.slug} value={group.slug}>{group.name}</option>
                ))}
              </select>
            </label>

            <label>
              Nombre de tours
              <input
                type="number"
                min={1}
                max={10}
                value={draftRounds}
                onChange={(e) => setDraftRounds(Number(e.target.value))}
              />
            </label>

            <label>
              Filtre type
              <select value={selectedDraftTraitType} onChange={(e) => setSelectedDraftTraitType(e.target.value)}>
                <option value="all">Tous</option>
                {[...new Set(allDraftTraits.map((trait) => trait.type))].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <div style={styles.slug}>Traits sélectionnés: {selectedDraftTraits.length}</div>

            <button onClick={() => setSelectedDraftTraits([])} disabled={selectedDraftTraits.length === 0}>Vider</button>
            <button
              onClick={launchDraft}
              disabled={!draftId || selectedDraftTraits.length === 0 || activeDraft?.status === 'active'}
            >
              🎲 Lancer le Draft
            </button>
          </div>

          <div style={styles.draftComposer}>
            <div style={styles.draftColumn}>
              <h3 style={{ marginTop: 0 }}>Tous les traits ({filteredAvailableDraftTraits.length})</h3>
              <div style={styles.traitList}>
                {filteredAvailableDraftTraits.map((trait) => (
                  <div key={trait.slug} style={styles.traitItem}>
                    <div>
                      <strong>{trait.name}</strong>{' '}
                      <small style={styles.slug}>({trait.type})</small>
                    </div>
                    <button onClick={() => addTraitToDraft(trait.slug)}>Ajouter</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.draftColumn}>
              <h3 style={{ marginTop: 0 }}>Traits dans le draft ({selectedDraftTraitDtos.length})</h3>
              <div style={styles.traitList}>
                {selectedDraftTraitDtos.length === 0 && <div style={styles.emptyState}>Le template est vide au départ.</div>}
                {selectedDraftTraitDtos.map((trait) => (
                  <div key={trait.slug} style={styles.traitItem}>
                    <div>
                      <strong>{trait.name}</strong>{' '}
                      <small style={styles.slug}>({trait.type})</small>
                    </div>
                    <button onClick={() => removeTraitFromDraft(trait.slug)} style={styles.dangerBtn}>Retirer</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={createOrSaveDraft}>{draftId ? 'Enregistrer le template' : 'Créer le template'}</button>
            <button onClick={launchDraft} disabled={!draftId || selectedDraftTraits.length === 0 || activeDraft?.status === 'active'}>
              Lancer le draft
            </button>
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
  dangerBtn: { background: 'var(--color-danger)' as string, minWidth: '2rem' }
}
