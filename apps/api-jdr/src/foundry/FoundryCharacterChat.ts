export type CharacterPresentationCard = {
  id: string
  name: string
  showName: boolean
  portraitUrl: string | null
  wikiUrl: string | null
  token: string | null
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}

export function renderCharacterPresentationCard(card: CharacterPresentationCard): string {
  const portrait = String(card.portraitUrl ?? '')
  const image = /^(https:\/\/|assets\/l7r\/)/i.test(portrait) ? portrait : ''
  const wiki = card.wikiUrl && /^https:\/\//i.test(card.wikiUrl) ? card.wikiUrl : null
  const action = wiki
    ? '<p><a class="button" href="' + escapeHtml(wiki) + '" target="_blank" rel="noopener noreferrer">Voir la fiche</a></p>'
    : '<p><button type="button" data-pf2-character-create="' + escapeHtml(card.id) +
      '" data-pf2-character-token="' + escapeHtml(card.token) +
      '" data-pf2-character-name="' + escapeHtml(card.showName ? card.name : '') + '">Créer la fiche</button></p>'
  return '<div class="pf2e-val-character-presentation" data-pf2-character-presentation-id="' + escapeHtml(card.id) + '">\n' +
    (card.showName ? '<p><strong>' + escapeHtml(card.name) + '</strong></p>\n' : '') +
    (image ? '<img src="' + escapeHtml(image) + '" alt="Portrait du personnage" style="max-width:100%;height:auto;display:block" />\n' : '') +
    action + '\n</div>'
}

export function foundryChatPresentationId(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null
  const row = record as Record<string, unknown>
  const flags = row.flags as Record<string, any> | undefined
  const flagId = flags?.['pf2e-val-toolkit']?.discordCharacterPresentation?.id
  if (typeof flagId === 'string' && flagId) return flagId
  const match = String(row.content ?? '').match(/data-pf2-character-presentation-id="([a-f0-9-]{36})"/i)
  return match?.[1] ?? null
}
