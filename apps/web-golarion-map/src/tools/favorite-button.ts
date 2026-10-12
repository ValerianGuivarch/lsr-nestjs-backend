// Shared campaign favorites are limited to already published map locations.
// The server validates publication independently of the browser's choice.
export type FavoriteTarget =
  | { kind: 'place'; id: string }
  | { kind: 'source'; fid: number }
  | { kind: 'label'; category: string; label: string }

export function createFavoriteButton(target: FavoriteTarget, isFavorite: boolean): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'pf2-favorite-action'
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'pf2-favorite-button'
  button.textContent = isFavorite ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'
  button.title = 'Favori partagé avec tous les joueurs'
  const status = document.createElement('span')
  status.setAttribute('role', 'status')
  wrapper.append(button, status)
  button.addEventListener('click', async () => {
    const url = (window.GOLARION_MAP_CONFIG?.placesUrl ?? '').replace(/\/places\/?$/, '/favorites')
    if (!url) { status.textContent = 'API non configurée'; return }
    button.disabled = true
    status.textContent = 'Enregistrement…'
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, important: !isFavorite }),
      })
      if (!response.ok) throw new Error(await response.text())
      status.textContent = 'Favori partagé enregistré.'
      // Reload so the icon, label, layer deduplication and shared favorites list
      // are refreshed together, without changing the map hash/position.
      window.location.reload()
    } catch (error) {
      button.disabled = false
      status.textContent = error instanceof Error ? error.message : String(error)
    }
  })
  return wrapper
}
