import { Marker, Popup } from 'maplibre-gl'
import { GolarionMap } from './GolarionMap'
import { createFavoriteButton, type FavoriteTarget } from './favorite-button'
import { showPlaceDialog, showQuestLinksDialog } from './quest-place-dialog'

type PublicPlace = {
  id: string
  name: string
  latitude: number
  longitude: number
  text: string
  mjText?: string
  icon: string
  important: boolean
  quest: boolean
  questName?: string
  questNames?: string[]
  questLinks?: Array<{ id: string; title: string; completed: boolean; url: string }>
  questUnresolved?: string[]
  questCompleted?: boolean
  origin?: string
  custom?: boolean
  fid?: number
  category?: string
  label?: string
}

const glyphs: Record<string, string> = {
  pin: '●',
  city: '◆',
  lodge: '⌂',
  ruins: '✦',
  camp: '▲',
  danger: '⚠',
  portal: '✧',
}

function markerElement(place: PublicPlace): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `pf2-public-place-marker${place.quest ? ' is-quest' : ''}${place.custom ? ' is-custom' : ''}${place.important ? ' is-favorite' : ''}`
  button.title = place.name
  button.setAttribute('aria-label', place.name)

  const icon = document.createElement('span')
  icon.className = 'pf2-public-place-icon'
  icon.textContent = place.quest ? '★' : place.custom ? '⌑' : (glyphs[place.icon] ?? glyphs.pin)

  const label = document.createElement('span')
  label.className = 'pf2-public-place-label'
  label.textContent = place.important && !place.quest ? `★ ${place.name}` : place.name

  button.append(icon, label)
  return button
}

function basicPopupContent(place: PublicPlace, mode: 'pj' | 'mj-light' | 'mj'): HTMLElement {
  const root = document.createElement('div')
  root.className = 'pf2-public-place-popup'
  const title = document.createElement('strong')
  title.textContent = place.name
  root.appendChild(title)
  if (place.quest) {
    const linked = place.questLinks ?? []
    const unresolved = place.questUnresolved ?? []
    const names = Array.isArray(place.questNames) && place.questNames.length
      ? place.questNames : place.questName ? [place.questName] : []
    const heading = document.createElement('p')
    heading.textContent = `★ ${linked.length + unresolved.length} quête${linked.length + unresolved.length > 1 ? 's' : ''} associée${linked.length + unresolved.length > 1 ? 's' : ''}`
    root.appendChild(heading)
    const list = document.createElement('ul')
    list.className = 'pf2-quest-names'
    for (const quest of linked) {
      const item = document.createElement('li')
      const link = document.createElement('a')
      link.textContent = quest.title
      link.href = quest.url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      item.append(link, document.createTextNode(quest.completed ? ' — Terminée' : ' — En cours'))
      if (quest.completed) item.classList.add('is-completed')
      list.appendChild(item)
    }
    for (const name of unresolved.length ? unresolved : linked.length ? [] : names) {
      const item = document.createElement('li')
      item.textContent = name + ' — Association Discord à vérifier'
      item.classList.add('is-unresolved')
      list.appendChild(item)
    }
    root.appendChild(list)
    if (mode !== 'pj') {
      const edit = document.createElement('button')
      edit.type = 'button'
      edit.className = 'pf2-place-edit-quests'
      edit.textContent = 'Associer / modifier les quêtes Discord'
      edit.onclick = () => void showQuestLinksDialog({
        id: place.id, name: place.name, questLinks: linked, questUnresolved: unresolved,
      })
      root.appendChild(edit)
    }
  }
  if (place.text) {
    const text = document.createElement('p')
    text.textContent = place.text
    root.appendChild(text)
  }
  const target: FavoriteTarget = place.id.startsWith('source:')
    ? typeof place.fid === 'number'
      ? { kind: 'source', fid: place.fid }
      : { kind: 'label', category: place.category || '', label: place.label || '' }
    : { kind: 'place', id: place.id }
  if (!place.quest) {
    root.appendChild(createFavoriteButton(target, place.important))
    if (place.custom) {
      const type = document.createElement('p')
      type.className = 'pf2-place-origin'
      type.textContent = place.origin === 'pj' ? '⌑ Lieu personnalisé ajouté par les PJ' : '⌑ Lieu personnalisé MJ'
      root.appendChild(type)
    }
  } else if (mode !== 'pj') {
    const controls = document.createElement('div')
    controls.className = 'pf2-quest-actions'
    const status = document.createElement('span')
    status.setAttribute('role', 'status')
    const button = (label: string, action: 'convert' | 'delete') => {
      const element = document.createElement('button')
      element.type = 'button'
      element.textContent = label
      element.addEventListener('click', async () => {
        if (action === 'delete' && !window.confirm(`Supprimer le lieu de quête « ${place.name} » ?`)) return
        const api = (window.GOLARION_MAP_CONFIG?.placesUrl ?? '').replace(/\/places\/?$/, '/quests')
        if (!api) { status.textContent = 'API indisponible'; return }
        element.disabled = true
        status.textContent = 'Enregistrement…'
        try {
          const response = await fetch(`${api}/${encodeURIComponent(place.id)}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          })
          if (!response.ok) throw new Error(await response.text())
          window.location.reload()
        } catch (error) {
          status.textContent = error instanceof Error ? error.message : String(error)
          element.disabled = false
        }
      })
      controls.appendChild(element)
    }
    button('Convertir en lieu normal', 'convert')
    button('Supprimer le lieu de quête', 'delete')
    controls.appendChild(status)
    root.appendChild(controls)
  }
  if (place.origin === 'pj') {
    const edit = document.createElement('button')
    edit.type = 'button'
    edit.className = 'pf2-place-edit-community'
    edit.textContent = 'Modifier ou supprimer ce lieu ajouté par les PJ'
    edit.onclick = () => void showPlaceDialog({
      latitude: place.latitude, longitude: place.longitude,
    }, mode, {
      id: place.id, name: place.name, latitude: place.latitude, longitude: place.longitude,
      text: place.text, origin: 'pj', quest: place.quest, custom: Boolean(place.custom),
      questLinks: place.questLinks ?? [],
    })
    root.appendChild(edit)
  }
  return root
}

function mjLightPopupContent(place: PublicPlace, onHidden: () => void): HTMLElement {
  const root = basicPopupContent(place, 'mj-light')
  root.classList.add('pf2-mj-light-popup')

  const publicLabel = document.createElement('label')
  publicLabel.textContent = 'Description visible par les PJ'
  const publicText = document.createElement('textarea')
  publicText.rows = 4
  publicText.maxLength = 4000
  publicText.value = place.text
  publicLabel.appendChild(publicText)
  root.appendChild(publicLabel)

  const mjLabel = document.createElement('label')
  mjLabel.textContent = 'Détails MJ (optionnel)'
  const mjText = document.createElement('textarea')
  mjText.rows = 4
  mjText.maxLength = 6000
  mjText.value = place.mjText ?? ''
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

  const update = async (visible: boolean) => {
    const base = window.GOLARION_MAP_CONFIG?.placesUrl ?? ''
    if (!base) throw new Error('API des lieux PF2 non configurée.')
    const response = await fetch(`${base}/${encodeURIComponent(place.id)}`, {
      method: 'PUT',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visible,
        publicText: publicText.value.trim(),
        mjText: mjText.value.trim(),
      }),
    })
    if (!response.ok) throw new Error(await response.text())
    place.text = publicText.value.trim()
    place.mjText = mjText.value.trim()
  }

  save.onclick = async () => {
    save.disabled = true
    hide.disabled = true
    try {
      await update(true)
      status.textContent = 'Descriptions enregistrées.'
      status.className = 'pf2-mj-light-status saved'
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      status.className = 'pf2-mj-light-status error'
    } finally {
      save.disabled = false
      hide.disabled = false
    }
  }

  hide.onclick = async () => {
    save.disabled = true
    hide.disabled = true
    try {
      await update(false)
      status.textContent = 'Lieu caché aux PJ.'
      status.className = 'pf2-mj-light-status saved'
      onHidden()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      status.className = 'pf2-mj-light-status error'
      save.disabled = false
      hide.disabled = false
    }
  }

  return root
}

export async function addPublicPlaceMarkers(gmap: GolarionMap, placesUrl: string, mode: 'pj' | 'mj-light' | 'mj' = 'pj'): Promise<void> {
  if (!placesUrl) return
  try {
    const response = await fetch(placesUrl, { credentials: 'omit', cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const raw: unknown = await response.json()
    const candidates: unknown[] = Array.isArray(raw) ? raw : []
    const places: PublicPlace[] = candidates.filter((value): value is PublicPlace => {
      if (!value || typeof value !== 'object') return false
      const item = value as Partial<PublicPlace>
      return typeof item.id === 'string' && typeof item.name === 'string' && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    })

    const entries = places.map((place) => {
      const element = markerElement(place)
      let marker: Marker
      const popup = new Popup({ offset: 18, closeButton: true })
      // Source-catalogue favorites are not editable through the local-place API.
      const popupContent = mode === 'mj-light' && !place.id.startsWith('source:')
        ? mjLightPopupContent(place, () => {
            popup.remove()
            marker.remove()
          })
        : basicPopupContent(place, mode)
      popup.setDOMContent(popupContent)
      // The anchor must depend on the icon only, never on the (potentially long) label.
      marker = new Marker({ element, anchor: 'center' })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(gmap.map)
      return { place, marker, element }
    })

    let showCompleted = false
    const updateLabelDensity = () => {
      const zoom = gmap.map.getZoom()
      // Only quest sites stay visible at world scale. Favorites use exactly
      // the same zoom threshold as ordinary locations.
      for (const { element, place } of entries) {
        element.style.display = place.quest ? (place.questCompleted && !showCompleted ? 'none' : '') : zoom >= 5.5 ? '' : 'none'
        element.classList.toggle('labels-hidden', zoom < (place.quest ? 6.5 : 5.5))
      }
    }
    updateLabelDensity()
    gmap.map.on('zoomend', updateLabelDensity)

    type JumpToPlace = { id: string; name: string; longitude: number; latitude: number; completed?: boolean; open: () => void }
    const makeList = (title: string, mark: string, places: JumpToPlace[]) => {
      const control = document.createElement('div')
      control.className = 'pf2-campaign-places-control maplibregl-ctrl'
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'pf2-campaign-places-toggle'
      toggle.textContent = `${mark} ${title} (${places.length})`
      toggle.setAttribute('aria-expanded', 'false')
      const list = document.createElement('div')
      list.className = 'pf2-campaign-places-list'
      list.hidden = true
      toggle.onclick = () => {
        list.hidden = !list.hidden
        toggle.setAttribute('aria-expanded', String(!list.hidden))
      }
      const refresh = (items: JumpToPlace[]) => {
        list.replaceChildren()
        toggle.textContent = `${mark} ${title} (${items.length})`
        if (!items.length) {
          const empty = document.createElement('p')
          empty.className = 'pf2-campaign-places-empty'
          empty.textContent = 'Aucun lieu pour le moment'
          list.appendChild(empty)
        }
        for (const place of [...items].sort((a,b) => a.name.localeCompare(b.name, 'fr'))) {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = `${mark} ${place.name}`
        button.onclick = () => {
          list.hidden = true
          toggle.setAttribute('aria-expanded', 'false')
          gmap.map.flyTo({
            center: [place.longitude, place.latitude],
            zoom: Math.max(7, gmap.map.getZoom()),
            duration: 900,
          })
          place.open()
        }
          list.appendChild(button)
        }
      }
      refresh(places)
      control.append(toggle, list)
      gmap.map.addControl({
        onAdd: () => control,
        onRemove: () => control.remove(),
      }, 'top-left')
      return refresh
    }

    const questPlaces = entries.filter(entry => entry.place.quest).map(entry => ({
      id: entry.place.id, name: entry.place.name,
      longitude: entry.place.longitude, latitude: entry.place.latitude,
      completed: Boolean(entry.place.questCompleted),
      open: () => entry.marker.togglePopup(),
    }))
    const visibleQuestPlaces = () => questPlaces.filter(place => showCompleted || !place.completed)
    const refreshQuestList = makeList('Lieux de quête', '★', visibleQuestPlaces())

    const completeControl = document.createElement('label')
    completeControl.className = 'pf2-campaign-completed-control maplibregl-ctrl'
    const completedInput = document.createElement('input')
    completedInput.type = 'checkbox'
    completedInput.checked = false
    completeControl.append(completedInput, document.createTextNode(' Afficher les quêtes terminées'))
    completedInput.addEventListener('change', () => {
      showCompleted = completedInput.checked
      updateLabelDensity()
      refreshQuestList(visibleQuestPlaces())
    })
    gmap.map.addControl({
      onAdd: () => completeControl,
      onRemove: () => completeControl.remove(),
    }, 'top-left')

    const favoritePlaces: JumpToPlace[] = entries
      .filter(entry => entry.place.important && !entry.place.quest)
      .map(entry => ({
        id: entry.place.id, name: entry.place.name,
        longitude: entry.place.longitude, latitude: entry.place.latitude,
        open: () => entry.marker.togglePopup(),
      }))

    // Source catalogue favorites (e.g. Grand Lodge) have ordinary map labels,
    // not custom persistent stars. Include them in the shared favorites menu.
    const favoritesUrl = placesUrl.replace(/\/places\/?$/, '/important-places')
    if (favoritesUrl !== placesUrl) {
      try {
        const response = await fetch(favoritesUrl, { credentials: 'omit', cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const rawFavorites: unknown = await response.json()
        if (Array.isArray(rawFavorites)) {
          for (const value of rawFavorites) {
            if (!value || typeof value !== 'object') continue
            const item = value as Partial<PublicPlace>
            if (typeof item.id !== 'string' || typeof item.name !== 'string'
              || !Number.isFinite(item.longitude) || !Number.isFinite(item.latitude)) continue
            if (favoritePlaces.some(place => place.id === item.id)) continue
            favoritePlaces.push({
              id: item.id, name: item.name, longitude: item.longitude!, latitude: item.latitude!,
              open: () => {
                const popup = document.createElement('div')
                popup.className = 'pf2-public-place-popup'
                const title = document.createElement('strong')
                title.textContent = item.name!
                popup.appendChild(title)
                if (item.text) {
                  const description = document.createElement('p')
                  description.textContent = item.text
                  popup.appendChild(description)
                }
                const target: FavoriteTarget | null = typeof item.fid === 'number'
                  ? { kind: 'source', fid: item.fid }
                  : typeof item.category === 'string' && typeof item.label === 'string'
                  ? { kind: 'label', category: item.category, label: item.label } : null
                if (target) popup.appendChild(createFavoriteButton(target, true))
                new Popup({ closeButton: true, offset: 12 })
                  .setLngLat([item.longitude!, item.latitude!])
                  .setDOMContent(popup).addTo(gmap.map)
              },
            })
          }
        }
      } catch (error) {
        console.warn('Impossible de charger les favoris du catalogue :', error)
      }
    }
    makeList('Favoris', '☆', favoritePlaces)

  } catch (error) {
    console.warn('Impossible de charger les lieux PF2 de la carte.', error)
  }
}
