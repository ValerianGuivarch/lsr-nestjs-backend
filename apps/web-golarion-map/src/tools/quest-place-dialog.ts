import type { GolarionMap } from './GolarionMap'

export type CommunityPlace = {
  id: string; name: string; latitude: number; longitude: number;
  text: string; origin: string; quest: boolean; custom: boolean;
  questLinks: Array<{ id: string; title: string; completed: boolean; url: string }>;
}

type QuestOption = { id: string; title: string; completed: boolean; url: string }
const api = (resource: string): string =>
  (window.GOLARION_MAP_CONFIG?.placesUrl ?? '').replace(/\/places\/?$/, '/' + resource)

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = ''): HTMLElementTagNameMap[K] {
  const item = document.createElement(tag)
  if (className) item.className = className
  return item
}

function field(labelText: string, control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): HTMLLabelElement {
  const wrapper = el('label', 'pf2-place-field')
  const caption = el('span')
  caption.textContent = labelText
  wrapper.append(caption, control)
  return wrapper
}

export async function showPlaceDialog(
  point: { latitude: number; longitude: number },
  mode: 'pj' | 'mj-light' | 'mj',
  existing?: CommunityPlace,
): Promise<void> {
  const questUrl = api('discord-quests')
  if (!questUrl) return
  let quests: QuestOption[] = []
  let loadWarning = ''
  try {
    const response = await fetch(questUrl, { cache: 'no-store' })
    if (!response.ok) throw Error('Impossible de charger les quêtes.')
    quests = (await response.json() as QuestOption[]).filter(quest =>
      typeof quest.id === 'string' && typeof quest.title === 'string')
  } catch (error) {
    loadWarning = error instanceof Error ? error.message : String(error)
  }

  const dialog = el('dialog', 'pf2-place-dialog')
  const form = el('form', 'pf2-place-dialog-body')
  form.noValidate = true
  form.addEventListener('submit', event => event.preventDefault())
  const heading = el('h2')
  heading.textContent = existing ? 'Modifier le lieu personnalisé' : 'Ajouter un lieu sur la carte'
  const subtitle = el('p', 'pf2-place-subtitle')
  subtitle.textContent = `Position : ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
  const name = el('input')
  name.type = 'text'
  name.maxLength = 140
  name.required = true
  name.value = existing?.name ?? ''
  name.placeholder = 'Nom du lieu'
  const description = el('textarea')
  description.rows = 3
  description.maxLength = 4000
  description.value = existing?.text ?? ''
  description.placeholder = 'Informations utiles à tous les PJ (facultatif)'
  const kind = el('select')
  for (const [value, label] of [['quest', '★ Lieu de quête'], ['custom', '⌑ Lieu personnalisé']]) {
    const option = el('option')
    option.value = value
    option.textContent = label
    kind.append(option)
  }
  kind.value = existing?.quest ? 'quest' : existing?.custom ? 'custom' : 'quest'
  const questSection = el('fieldset', 'pf2-place-quest-section')
  const legend = el('legend')
  legend.textContent = 'Quêtes liées au lieu (choisis-en plusieurs si besoin)'
  const filter = el('input')
  filter.type = 'search'
  filter.placeholder = 'Rechercher une quête Discord…'
  filter.autocomplete = 'off'
  const choices = el('div', 'pf2-place-quest-choices')
  const selected = new Set(existing?.questLinks?.map(link => link.id) ?? [])
  const renderChoices = () => {
    choices.replaceChildren()
    const term = filter.value.trim().toLocaleLowerCase('fr')
    const options = quests.filter(quest =>
      !term || quest.title.toLocaleLowerCase('fr').includes(term))
    for (const quest of options) {
      const row = el('label', 'pf2-place-quest-option')
      const check = el('input')
      check.type = 'checkbox'
      check.checked = selected.has(quest.id)
      check.addEventListener('change', () => {
        if (check.checked) selected.add(quest.id)
        else selected.delete(quest.id)
      })
      const text = el('span')
      text.textContent = quest.title + (quest.completed ? ' — Terminée' : '')
      row.append(check, text)
      choices.append(row)
    }
    if (!options.length) {
      const empty = el('p')
      empty.textContent = loadWarning || 'Aucune quête correspondante.'
      choices.append(empty)
    }
  }
  filter.addEventListener('input', renderChoices)
  renderChoices()
  questSection.append(legend, filter, choices)

  const status = el('p', 'pf2-place-dialog-status')
  status.setAttribute('role', 'status')
  const actions = el('div', 'pf2-place-dialog-actions')
  const cancel = el('button')
  cancel.type = 'button'
  cancel.textContent = 'Annuler'
  cancel.addEventListener('click', () => dialog.close())
  const save = el('button', 'pf2-place-dialog-primary')
  save.type = 'submit'
  save.textContent = 'Enregistrer pour tous'
  actions.append(cancel, save)
  const refresh = () => window.location.reload()

  const doSave = async () => {
    const title = name.value.trim()
    const isQuest = kind.value === 'quest'
    if (!title || (isQuest && !selected.size)) {
      status.textContent = isQuest ? 'Saisis un titre et choisis au moins une quête Discord.' : 'Saisis un titre.'
      return
    }
    const body = {
      name: title, kind: isQuest ? 'quest' : 'custom', description: description.value.trim(),
      latitude: point.latitude, longitude: point.longitude,
      questIds: isQuest ? [...selected] : [],
    }
    let url: string
    let method: string
    if (existing) {
      url = api('community-places') + '/' + encodeURIComponent(existing.id)
      method = 'PUT'
    } else if (mode === 'mj' && isQuest) {
      url = api('quests')
      method = 'POST'
    } else {
      url = api('community-places')
      method = 'POST'
    }
    save.disabled = true
    status.textContent = 'Enregistrement…'
    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!response.ok) throw Error(await response.text())
      refresh()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      save.disabled = false
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); void doSave() })
  kind.addEventListener('change', () => {
    questSection.hidden = kind.value !== 'quest'
  })
  questSection.hidden = kind.value !== 'quest'
  form.append(heading, subtitle, field('Nom du lieu', name), field('Type de lieu', kind), field('Description publique', description), questSection, status, actions)

  if (existing?.origin === 'pj') {
    const remove = el('button', 'pf2-place-dialog-delete')
    remove.type = 'button'
    remove.textContent = 'Supprimer ce lieu'
    remove.onclick = () => {
      remove.disabled = true
      const confirm = el('div', 'pf2-place-delete-confirm')
      const warning = el('p')
      warning.textContent = 'Supprimer ce lieu pour tous les joueurs ? Cette action est définitive.'
      const yes = el('button')
      yes.type = 'button'
      yes.textContent = 'Confirmer la suppression'
      yes.onclick = async () => {
        status.textContent = 'Suppression…'
        try {
          const response = await fetch(api('community-places') + '/' + encodeURIComponent(existing.id), { method: 'DELETE' })
          if (!response.ok) throw Error(await response.text())
          refresh()
        } catch (error) {
          status.textContent = error instanceof Error ? error.message : String(error)
          remove.disabled = false
        }
      }
      const no = el('button')
      no.type = 'button'
      no.textContent = 'Conserver'
      no.onclick = () => { confirm.remove(); remove.disabled = false }
      confirm.append(warning, yes, no)
      form.append(confirm)
    }
    form.append(remove)
  }
  dialog.append(form)
  document.body.append(dialog)
  dialog.addEventListener('close', () => dialog.remove())
  dialog.showModal()
  name.focus()
}

export function addPlaceCreationControl(gmap: GolarionMap, mode: 'pj'|'mj-light'|'mj'): void {
  const root = el('div', 'maplibregl-ctrl maplibregl-ctrl-group pf2-place-create-control')
  const button = el('button')
  button.type = 'button'
  button.textContent = '＋ Lieu'
  button.title = 'Ajouter un lieu personnalisé ou un lieu de quête'
  button.setAttribute('aria-label', 'Ajouter un lieu')
  root.append(button)
  let armed = false
  const onClick = (event: { lngLat: { lat: number; lng: number } }) => {
    if (!armed) return
    armed = false
    button.textContent = '＋ Lieu'
    button.classList.remove('is-armed')
    void showPlaceDialog({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }, mode)
  }
  const toggle = () => {
    armed = !armed
    button.textContent = armed ? 'Annuler' : '＋ Lieu'
    button.classList.toggle('is-armed', armed)
  }
  button.addEventListener('click', toggle)
  gmap.map.on('click', onClick)
  gmap.map.addControl({
    onAdd: () => root,
    onRemove: () => { gmap.map.off('click', onClick); root.remove() },
  }, 'top-right')
}
export async function showQuestLinksDialog(place: {
  id: string; name: string; questLinks: Array<{ id: string; title: string }>;
  questUnresolved?: string[];
}): Promise<void> {
  const dialog = el('dialog', 'pf2-place-dialog')
  const form = el('form', 'pf2-place-dialog-body')
  form.addEventListener('submit', event => event.preventDefault())
  const heading = el('h2')
  heading.textContent = 'Quêtes de ' + place.name
  const hint = el('p', 'pf2-place-subtitle')
  hint.textContent = 'Sélectionne une ou plusieurs quêtes du forum Discord.'
  const filter = el('input')
  filter.type = 'search'
  filter.placeholder = 'Rechercher une quête…'
  const rows = el('div', 'pf2-place-quest-choices')
  const status = el('p')
  status.setAttribute('role', 'status')
  const selected = new Set(place.questLinks?.map(quest => quest.id) ?? [])
  let options: QuestOption[] = []
  try {
    const response = await fetch(api('discord-quests'), { cache: 'no-store' })
    if (!response.ok) throw Error('Catalogue Discord indisponible.')
    options = await response.json() as QuestOption[]
  } catch (error) { status.textContent = error instanceof Error ? error.message : String(error) }
  const render = () => {
    rows.replaceChildren()
    for (const quest of options.filter(quest => quest.title.toLocaleLowerCase('fr').includes(filter.value.toLocaleLowerCase('fr')))) {
      const label = el('label', 'pf2-place-quest-option')
      const checkbox = el('input')
      checkbox.type = 'checkbox'
      checkbox.checked = selected.has(quest.id)
      checkbox.onchange = () => checkbox.checked ? selected.add(quest.id) : selected.delete(quest.id)
      const text = el('span')
      text.textContent = quest.title + (quest.completed ? ' — Terminée' : '')
      label.append(checkbox, text)
      rows.append(label)
    }
  }
  render()
  filter.oninput = render
  if (place.questUnresolved?.length) {
    const warning = el('p', 'pf2-place-unresolved')
    warning.textContent = 'Anciennes quêtes sans association : ' + place.questUnresolved.join(' ; ')
      + '. Elles seront remplacées quand tu enregistreras cette sélection.'
    form.append(warning)
  }
  const buttons = el('div', 'pf2-place-dialog-actions')
  const cancel = el('button')
  cancel.type = 'button'
  cancel.textContent = 'Annuler'
  cancel.onclick = () => dialog.close()
  const save = el('button', 'pf2-place-dialog-primary')
  save.type = 'submit'
  save.textContent = 'Enregistrer les associations'
  save.onclick = async () => {
    if (!selected.size) { status.textContent = 'Choisis au moins une quête.'; return }
    save.disabled = true
    status.textContent = 'Enregistrement…'
    try {
      const response = await fetch(api('quests') + '/' + encodeURIComponent(place.id) + '/links', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questIds: [...selected] }),
      })
      if (!response.ok) throw Error(await response.text())
      window.location.reload()
    } catch (error) {
      save.disabled = false
      status.textContent = error instanceof Error ? error.message : String(error)
    }
  }
  buttons.append(cancel, save)
  form.append(heading, hint, filter, rows, status, buttons)
  dialog.append(form)
  document.body.append(dialog)
  dialog.addEventListener('close', () => dialog.remove())
  dialog.showModal()
}
