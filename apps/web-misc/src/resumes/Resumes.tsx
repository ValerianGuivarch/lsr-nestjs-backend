import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './resumes.css'
import './resumes-editor.css'

type Actor = {
  uuid: string
  name: string
}

type SessionContentLink = {
  scenarioId: string
  componentId: string | null
  sortOrder: number
}

type ScenarioOption = {
  id: string
  title: string
  kind: string
  playableComponents: Array<{ id: string; title: string; order: number }>
}

type Resume = {
  id: string
  sessionNumber: number
  date: string
  inGameStartDate: string
  inGameEndDate: string
  title: string
  participants: string[]
  longSummaryAuthor: string | null
  shortSummaryAuthor: string | null
  sessionXp: number
  longSummaryXp: number
  shortSummaryXp: number
  longSummaryUrl: string
  shortSummary: string
  published: boolean
  content: SessionContentLink[]
}

type Draft = Omit<Resume, 'id'>

// Le proxy historique /apil7r ajoute déjà le préfixe /api côté NestJS.
const endpoint = '/apil7r/pf2-mj'
const playerActorName = /^\S(?:.*\S)?\s+\([^()]+\)$/u
const discordShortSummaryLimit = 1400

const blank = (sessionNumber = 1): Draft => ({
  sessionNumber,
  date: '',
  inGameStartDate: '',
  inGameEndDate: '',
  title: '',
  participants: [],
  longSummaryAuthor: null,
  shortSummaryAuthor: null,
  sessionXp: 0,
  longSummaryXp: 0,
  shortSummaryXp: 0,
  longSummaryUrl: '',
  shortSummary: '',
  published: false,
  content: [],
})

const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Une erreur est survenue.'

const normalizeContent = (value: unknown): SessionContentLink[] =>
  Array.isArray(value)
    ? value.flatMap((raw, index) => {
        if (!raw || typeof raw !== 'object') return []
        const item = raw as Record<string, unknown>
        const scenarioId = typeof item.scenarioId === 'string' ? item.scenarioId.trim() : ''
        if (!scenarioId) return []
        const componentId = typeof item.componentId === 'string' && item.componentId.trim() ? item.componentId.trim() : null
        return [{ scenarioId, componentId, sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index }]
      })
    : []

const normalizeResume = (value: unknown): Resume | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || typeof item.sessionNumber !== 'number') return null
  return {
    ...(item as unknown as Resume),
    content: normalizeContent(item.content),
  }
}

const scenarioOptionsFromCatalogue = (value: unknown): ScenarioOption[] => {
  if (!value || typeof value !== 'object') return []
  const entries = (value as { entries?: unknown }).entries
  if (!Array.isArray(entries)) return []
  return entries.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const item = raw as Record<string, unknown>
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (!id) return []
    const title =
      typeof item.titleFr === 'string' && item.titleFr.trim()
        ? item.titleFr.trim()
        : typeof item.titleOriginal === 'string' && item.titleOriginal.trim()
        ? item.titleOriginal.trim()
        : id
    const playableComponents = Array.isArray(item.playableComponents)
      ? item.playableComponents.flatMap((component, index) => {
          if (!component || typeof component !== 'object') return []
          const candidate = component as Record<string, unknown>
          const componentId = typeof candidate.id === 'string' ? candidate.id.trim() : ''
          if (!componentId) return []
          return [{
            id: componentId,
            title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : componentId,
            order: typeof candidate.order === 'number' ? candidate.order : index,
          }]
        }).sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, 'fr'))
      : []
    return [{ id, title, kind: typeof item.kind === 'string' ? item.kind : '', playableComponents }]
  }).sort((left, right) => left.title.localeCompare(right.title, 'fr'))
}

export default function Resumes() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [scenarioOptions, setScenarioOptions] = useState<ScenarioOption[]>([])
  const [draft, setDraft] = useState<Draft>(blank())
  const [editedId, setEditedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const names = useMemo(
    () =>
      new Map(
        actors.map((actor) => [
          actor.uuid,
          actor.name,
        ]),
      ),
    [actors],
  )

  const scenariosById = useMemo(
    () => new Map(scenarioOptions.map((scenario) => [scenario.id, scenario])),
    [scenarioOptions],
  )

  const nextNumber = useMemo(
    () =>
      Math.max(
        0,
        ...resumes.map(
          (resume) => resume.sessionNumber,
        ),
      ) + 1,
    [resumes],
  )

  const loadActors = async () => {
    try {
      const actorResponse = await fetch(
        `${endpoint}/actors`,
      )

      if (actorResponse.ok) {
        const loadedActors: Actor[] =
          await actorResponse.json()

        // Garde-fou côté interface : seuls les PJ nommés « PJ (joueur) »
        // peuvent être sélectionnés, même si une ancienne API répond encore.
        setActors(
          loadedActors.filter(
            (actor) =>
              playerActorName.test(
                actor.name.trim(),
              ),
          ),
        )
      } else {
        setNotice(
          'Les résumés sont disponibles ; Foundry est hors ligne, les noms de PJ ne peuvent pas être chargés.',
        )
      }
    } catch {
      setNotice(
        'Les résumés sont disponibles ; Foundry est hors ligne, les noms de PJ ne peuvent pas être chargés.',
      )
    }
  }

  const loadCatalogue = async () => {
    try {
      const response = await fetch(`${endpoint}/catalogue`)
      if (!response.ok) return
      setScenarioOptions(scenarioOptionsFromCatalogue(await response.json()))
    } catch {
      // Les résumés restent éditables même si le catalogue est momentanément indisponible.
    }
  }

  const load = async () => {
    try {
      const resumeResponse =
        await fetch(
          `${endpoint}/sessions`,
        )

      const payload =
        await resumeResponse
          .json()
          .catch(() => null)

      if (!resumeResponse.ok) {
        throw new Error(
          payload?.message ??
            'Impossible de charger les résumés.',
        )
      }

      setResumes(Array.isArray(payload) ? payload.flatMap((item) => { const normalized = normalizeResume(item); return normalized ? [normalized] : [] }) : [])

      void loadActors()
      void loadCatalogue()
    } catch (error) {
      setNotice(
        errorText(error),
      )
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const create = () => {
    setEditedId(null)
    setDraft(
      blank(nextNumber),
    )
    setOpen(true)
    setNotice('')
  }

  const edit = (
    resume: Resume,
  ) => {
    setEditedId(resume.id)
    setDraft({
      ...resume,
    })
    setOpen(true)
    setNotice('')
  }

  const close = () => {
    setOpen(false)
    setEditedId(null)
  }

  const toggleParticipant = (
    uuid: string,
  ) => {
    setDraft(
      (current) => ({
        ...current,
        participants:
          current.participants.includes(
            uuid,
          )
            ? current.participants.filter(
                (participant) =>
                  participant !== uuid,
              )
            : [
                ...current.participants,
                uuid,
              ],
      }),
    )
  }

  const addContentLink = () => {
    setDraft((current) => ({
      ...current,
      content: [...current.content, { scenarioId: '', componentId: null, sortOrder: current.content.length }],
    }))
  }

  const updateContentLink = (index: number, scenarioId: string, componentId: string | null = null) => {
    setDraft((current) => ({
      ...current,
      content: current.content.map((link, linkIndex) =>
        linkIndex === index
          ? { scenarioId, componentId, sortOrder: index }
          : { ...link, sortOrder: linkIndex },
      ),
    }))
  }

  const removeContentLink = (index: number) => {
    setDraft((current) => ({
      ...current,
      content: current.content
        .filter((_, linkIndex) => linkIndex !== index)
        .map((link, linkIndex) => ({ ...link, sortOrder: linkIndex })),
    }))
  }

  const save = async (event: Pick<FormEvent, 'preventDefault'>, publish = false, unpublish = false) => {
    event.preventDefault()

    try {
      const response =
        await fetch(
          publish && editedId
            ? `${endpoint}/sessions/${encodeURIComponent(editedId)}/publish`
            : editedId
            ? `${endpoint}/sessions/${encodeURIComponent(
                editedId,
              )}`
            : `${endpoint}/sessions`,
          {
            method: publish && editedId ? 'POST' : editedId ? 'PUT' : 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              {
                ...draft,
                content: draft.content.filter((link) => link.scenarioId).map((link, index) => ({ ...link, sortOrder: index })),
                published: publish ? true : unpublish ? false : draft.published,
              },
            ),
          },
        )

      const payload =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible d’enregistrer le résumé.',
        )
      }

      close()

      await load()
    } catch (error) {
      setNotice(
        errorText(error),
      )
    }
  }

  const remove = async (
    resume: Resume,
  ) => {
    const confirmed =
      window.confirm(
        `Supprimer définitivement le résumé n°${resume.sessionNumber}${
          resume.title
            ? ` — ${resume.title}`
            : ''
        } ?`,
      )

    if (!confirmed) {
      return
    }

    setDeletingId(
      resume.id,
    )
    setNotice('')

    try {
      const response =
        await fetch(
          `${endpoint}/sessions/${encodeURIComponent(
            resume.id,
          )}`,
          {
            method: 'DELETE',
          },
        )

      const payload =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible de supprimer le résumé.',
        )
      }

      if (
        editedId ===
        resume.id
      ) {
        close()
      }

      await load()
    } catch (error) {
      setNotice(
        errorText(error),
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="resumes-app">
      <header className="resumes-header">
        <Link
          to="/"
          className="resumes-brand"
        >
          <span>✦</span>

          <div>
            <strong>
              PATHFINDER 2
            </strong>

            <small>
              CHRONIQUES DE CAMPAGNE
            </small>
          </div>
        </Link>

        <button
          onClick={create}
        >
          + Nouveau résumé
        </button>
      </header>

      <section className="resumes-hero">
        <div>
          <small>
            JOURNAL DE CAMPAGNE
          </small>

          <h1>
            Résumés
          </h1>

          <p>
            Les traces de chaque partie,
            ordonnées par numéro de séance.
            Les textes longs restent dans le
            wiki ; ici, on garde leur lien et
            les attributions d’XP.
          </p>
        </div>

        <b>
          {resumes.length}

          <small>
            résumé
            {resumes.length > 1
              ? 's'
              : ''}
          </small>
        </b>
      </section>

      {notice && (
        <p className="resumes-notice">
          {notice}
        </p>
      )}

      <section className="resume-timeline">
        {resumes.length ? (
          resumes.map(
            (resume) => (
              <article
                className="resume-card"
                key={resume.id}
              >
                <div className="resume-number">
                  {String(
                    resume.sessionNumber,
                  ).padStart(
                    2,
                    '0',
                  )}
                </div>

                <div className="resume-content">
                  <div className="resume-heading">
                    <div>
                      <small>
                        {[
                          resume.date && `Jeu : ${resume.date}`,
                          resume.inGameStartDate && `En jeu : ${resume.inGameStartDate}${resume.inGameEndDate ? ` → ${resume.inGameEndDate}` : ''}`,
                        ].filter(Boolean).join(' · ') || 'Dates non renseignées'}
                      </small>

                      <h2>
                        {resume.title ||
                          `Résumé n°${resume.sessionNumber}`}
                      </h2>
                    </div>

                    <div className="resume-actions">
                      <button
                        type="button"
                        onClick={() =>
                          edit(
                            resume,
                          )
                        }
                      >
                        Éditer
                      </button>

                      <button
                        type="button"
                        className="resume-delete"
                        disabled={
                          deletingId ===
                          resume.id
                        }
                        onClick={() =>
                          void remove(
                            resume,
                          )
                        }
                      >
                        {deletingId ===
                        resume.id
                          ? 'Suppression…'
                          : 'Supprimer'}
                      </button>
                    </div>
                  </div>

                  <p className="resume-players">
                    {resume
                      .participants
                      .length
                      ? resume.participants
                          .map(
                            (id) =>
                              names.get(
                                id,
                              ) ??
                              id,
                          )
                          .join(
                            ' · ',
                          )
                      : 'Participants non renseignés'}
                  </p>

                  {resume.content.length > 0 && (
                    <div className="resume-mission-links">
                      {resume.content.map((link, index) => {
                        const scenario = scenariosById.get(link.scenarioId)
                        const component = scenario?.playableComponents.find((candidate) => candidate.id === link.componentId)
                        const target = `${scenario?.kind === 'campaign' ? '/pf2-mj/campaigns/' : '/pf2-mj/scenarios/'}${encodeURIComponent(link.scenarioId)}`
                        return (
                          <Link key={`${link.scenarioId}:${link.componentId ?? ''}:${index}`} to={target}>
                            {scenario?.title ?? link.scenarioId}
                            {component ? ` · ${component.title}` : ''}
                          </Link>
                        )
                      })}
                    </div>
                  )}

                  {resume.shortSummary ? (
                    <p className="resume-short">
                      {
                        resume.shortSummary
                      }
                    </p>
                  ) : (
                    <p className="resume-empty">
                      Résumé court à écrire.
                    </p>
                  )}

                  <footer>
                    <span>
                      ⚑{' '}
                      {resume.sessionXp *
                        resume
                          .participants
                          .length}{' '}
                      XP total ·{' '}
                      {
                        resume.sessionXp
                      }{' '}
                      par PJ
                    </span>

                    {resume.shortSummaryAuthor && (
                      <span>
                        ✎{' '}
                        {names.get(
                          resume.shortSummaryAuthor,
                        ) ??
                          resume.shortSummaryAuthor}{' '}
                        ·{' '}
                        {
                          resume.shortSummaryXp
                        }{' '}
                        XP
                      </span>
                    )}

                    {resume.longSummaryAuthor && (
                      <span>
                        ⌁{' '}
                        {names.get(
                          resume.longSummaryAuthor,
                        ) ??
                          resume.longSummaryAuthor}{' '}
                        ·{' '}
                        {
                          resume.longSummaryXp
                        }{' '}
                        XP
                      </span>
                    )}

                    {resume.longSummaryUrl && (
                      <a
                        href={
                          resume.longSummaryUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lire le résumé long ↗
                      </a>
                    )}
                  </footer>
                </div>
              </article>
            ),
          )
        ) : (
          <div className="resumes-empty">
            <h2>
              La chronique commence ici.
            </h2>

            <p>
              Crée le premier résumé : seul
              son numéro est requis.
            </p>

            <button
              onClick={create}
            >
              Créer le résumé n°1
            </button>
          </div>
        )}
      </section>

      {open && (
        <div
          className="resume-editor-backdrop"
          onMouseDown={(
            event,
          ) =>
            event.target ===
              event.currentTarget &&
            close()
          }
        >
          <form
            className="resume-editor"
            onSubmit={save}
          >
            <div className="resume-editor-content">
            <header>
              <div>
                <small>
                  {editedId
                    ? 'MODIFIER'
                    : 'CRÉER'}
                </small>

                <h2>
                  {editedId
                    ? `Résumé n°${draft.sessionNumber}`
                    : 'Nouveau résumé'}
                </h2>
              </div>

              <button
                type="button"
                onClick={close}
              >
                ×
              </button>
            </header>

            <label>
              Numéro de résumé

              <input
                type="number"
                min="1"
                step="1"
                required
                value={
                  draft.sessionNumber
                }
                onChange={(
                  event,
                ) =>
                  setDraft({
                    ...draft,
                    sessionNumber:
                      Number(
                        event
                          .target
                          .value,
                      ),
                  })
                }
              />
            </label>

            <div className="resume-form-triple">
              <label>
                Date de jeu réelle (optionnelle)

                <input
                  type="date"
                  value={
                    draft.date
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      date:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                Début en jeu (optionnel)

                <input
                  type="date"
                  value={draft.inGameStartDate}
                  onChange={(event) => setDraft({ ...draft, inGameStartDate: event.target.value })}
                />
              </label>

              <label>
                Fin en jeu (optionnelle)

                <input
                  type="date"
                  value={draft.inGameEndDate}
                  onChange={(event) => setDraft({ ...draft, inGameEndDate: event.target.value })}
                />
              </label>

              <label>
                Titre (optionnel)

                <input
                  value={
                    draft.title
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      title:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <fieldset className="resume-missions">
              <legend>Mission / scénario joué</legend>
              <p>Optionnel. Lie cette séance au journal MJ et, si utile, à un composant jouable précis.</p>

              {draft.content.map((link, index) => {
                const scenario = scenariosById.get(link.scenarioId)
                return (
                  <div className="resume-mission-row" key={`${index}:${link.scenarioId}:${link.componentId ?? ''}`}>
                    <label>
                      Scénario
                      <select
                        value={link.scenarioId}
                        onChange={(event) => updateContentLink(index, event.target.value, null)}
                      >
                        <option value="">Choisir…</option>
                        {scenarioOptions.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Composant
                      <select
                        value={link.componentId ?? ''}
                        disabled={!link.scenarioId || !scenario?.playableComponents.length}
                        onChange={(event) => updateContentLink(index, link.scenarioId, event.target.value || null)}
                      >
                        <option value="">{scenario?.playableComponents.length ? 'Scénario entier / non précisé' : 'Aucun composant documenté'}</option>
                        {scenario?.playableComponents.map((component) => (
                          <option key={component.id} value={component.id}>{component.title}</option>
                        ))}
                      </select>
                    </label>

                    <button type="button" className="resume-mission-remove" onClick={() => removeContentLink(index)}>Retirer</button>
                  </div>
                )
              })}

              <button type="button" className="resume-mission-add" onClick={addContentLink}>+ Lier une mission</button>
            </fieldset>

            <fieldset className="resume-participants">
              <legend>
                Participants
              </legend>

              <div className="resume-participant-list">
                {actors.map(
                  (actor) => (
                    <label
                      className="resume-participant"
                      key={actor.uuid}
                    >
                      <input
                        type="checkbox"
                        checked={draft.participants.includes(actor.uuid)}
                        onChange={() =>
                          toggleParticipant(actor.uuid)
                        }
                      />

                      <span>
                        {actor.name}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </fieldset>

            <div className="resume-form-triple">
              <label>
                XP par PJ

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    draft.sessionXp
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      sessionXp:
                        Number(
                          event
                            .target
                            .value,
                        ),
                    })
                  }
                />

                <small>
                  XP total indicatif :{' '}
                  {draft.sessionXp *
                    draft
                      .participants
                      .length}
                </small>
              </label>

              <label>
                XP court

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    draft.shortSummaryXp
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      shortSummaryXp:
                        Number(
                          event
                            .target
                            .value,
                        ),
                    })
                  }
                />
              </label>

              <label>
                XP long

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    draft.longSummaryXp
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      longSummaryXp:
                        Number(
                          event
                            .target
                            .value,
                        ),
                    })
                  }
                />
              </label>
            </div>

            <div className="resume-form-pair">
              <label>
                Auteur court

                <select
                  value={
                    draft.shortSummaryAuthor ??
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      shortSummaryAuthor:
                        event
                          .target
                          .value ||
                        null,
                    })
                  }
                >
                  <option value="">
                    Non attribué
                  </option>

                  {actors.map(
                    (actor) => (
                      <option
                        key={
                          actor.uuid
                        }
                        value={
                          actor.uuid
                        }
                      >
                        {
                          actor.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Auteur long

                <select
                  value={
                    draft.longSummaryAuthor ??
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft({
                      ...draft,
                      longSummaryAuthor:
                        event
                          .target
                          .value ||
                        null,
                    })
                  }
                >
                  <option value="">
                    Non attribué
                  </option>

                  {actors.map(
                    (actor) => (
                      <option
                        key={
                          actor.uuid
                        }
                        value={
                          actor.uuid
                        }
                      >
                        {
                          actor.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label>
              Résumé court (optionnel)

              <textarea
                rows={6}
                maxLength={discordShortSummaryLimit}
                value={
                  draft.shortSummary
                }
                onChange={(
                  event,
                ) =>
                  setDraft({
                    ...draft,
                    shortSummary:
                      event
                        .target
                        .value,
                  })
                }
              />

              <small>
                {draft.shortSummary.length} / {discordShortSummaryLimit} caractères — marge incluse pour les informations Discord.
              </small>
            </label>

            <label>
              Lien du résumé long
              (optionnel)

              <input
                type="url"
                placeholder="https://wiki…"
                value={
                  draft.longSummaryUrl
                }
                onChange={(
                  event,
                ) =>
                  setDraft({
                    ...draft,
                    longSummaryUrl:
                      event
                        .target
                        .value,
                  })
                }
              />

              <small>
                Le contenu long appartient
                au wiki : cette page garde
                uniquement le lien.
              </small>
            </label>
            </div>

            <footer className="resume-editor-actions">
              <button
                className="resume-save"
                type="submit"
              >
                {editedId ? 'Sauvegarder' : 'Créer le brouillon'}
              </button>
              {editedId && !draft.published && <button className="resume-save" type="button" onClick={(event) => void save(event, true)}>Publier</button>}
              {editedId && draft.published && <button className="resume-save" type="button" onClick={(event) => void save(event, false, true)}>Remettre en brouillon</button>}
            </footer>
          </form>
        </div>
      )}
    </main>
  )
}
