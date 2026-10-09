import { resetMapVisibilityCache } from '../utils/map-visibility'

export type MjLightCurationValue = {
  fid?: number
  category: string
  label: string
  publicLabel: string
  publicText: string
  mjText: string
}

type Options = {
  onHidden?: () => void
  onSaved?: (next: MjLightCurationValue) => void
}

async function updateVisibility(value: MjLightCurationValue, visibility: 'visible' | 'hidden'): Promise<MjLightCurationValue> {
  const url = window.GOLARION_MAP_CONFIG?.visibilityUrl ?? ''
  if (!url) throw new Error('API de visibilité cartographique non configurée.')
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(typeof value.fid === 'number' ? { fid: value.fid } : {}),
      category: value.category,
      label: value.label,
      visibility,
      publicLabel: value.publicLabel,
      publicText: value.publicText,
      mjText: value.mjText,
    }),
  })
  if (!response.ok) throw new Error(await response.text())
  resetMapVisibilityCache()
  return value
}

export function createMjLightCurationPanel(initial: MjLightCurationValue, options: Options = {}): HTMLElement {
  const root = document.createElement('section')
  root.className = 'pf2-mj-light-curation'

  const publicLabel = document.createElement('label')
  publicLabel.textContent = 'Description visible par les PJ'
  const publicText = document.createElement('textarea')
  publicText.rows = 4
  publicText.maxLength = 4000
  publicText.value = initial.publicText
  publicText.placeholder = 'Ce que les joueurs peuvent savoir sur ce lieu.'
  publicLabel.appendChild(publicText)
  root.appendChild(publicLabel)

  const mjLabel = document.createElement('label')
  mjLabel.textContent = 'Détails MJ (optionnel)'
  const mjText = document.createElement('textarea')
  mjText.rows = 4
  mjText.maxLength = 6000
  mjText.value = initial.mjText
  mjText.placeholder = 'Informations utiles au MJ seulement : contexte, secret, rappel de scénario…'
  mjLabel.appendChild(mjText)
  root.appendChild(mjLabel)

  const status = document.createElement('div')
  status.className = 'pf2-mj-light-status'
  root.appendChild(status)

  const actions = document.createElement('div')
  actions.className = 'pf2-mj-light-actions'
  const save = document.createElement('button')
  save.type = 'button'
  save.className = 'pf2-map-curation-save'
  save.textContent = 'Enregistrer'
  const hide = document.createElement('button')
  hide.type = 'button'
  hide.className = 'pf2-map-curation-hide'
  hide.textContent = 'Cacher aux PJ'
  actions.append(save, hide)
  root.appendChild(actions)

  const current = (): MjLightCurationValue => ({
    ...initial,
    publicText: publicText.value.trim(),
    mjText: mjText.value.trim(),
  })

  save.onclick = async () => {
    save.disabled = true
    hide.disabled = true
    try {
      const next = current()
      await updateVisibility(next, 'visible')
      status.textContent = 'Descriptions enregistrées.'
      status.className = 'pf2-mj-light-status saved'
      options.onSaved?.(next)
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      status.className = 'pf2-mj-light-status error'
    } finally {
      save.disabled = false
      hide.disabled = false
    }
  }

  hide.onclick = async () => {
    hide.disabled = true
    save.disabled = true
    try {
      await updateVisibility(current(), 'hidden')
      status.textContent = 'Lieu caché aux PJ.'
      status.className = 'pf2-mj-light-status saved'
      options.onHidden?.()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      status.className = 'pf2-mj-light-status error'
      hide.disabled = false
      save.disabled = false
    }
  }

  return root
}
