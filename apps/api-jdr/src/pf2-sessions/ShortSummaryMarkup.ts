const wikiLinkPattern = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g

export function shortSummaryDefaultLabel(title: string): string {
  const normalized = title.trim().replace(/_/g, ' ')
  const colon = normalized.indexOf(':')
  return (colon >= 0 ? normalized.slice(colon + 1) : normalized).trim() || normalized
}

/**
 * Discord ne publie pas les liens internes du wiki : ils deviennent simplement
 * des libellés en gras. Le texte stocké reste du wiki-lite partagé avec MediaWiki.
 */
export function shortSummaryForDiscord(value: string): string {
  return value.replace(wikiLinkPattern, (raw, rawTitle: string, rawLabel?: string) => {
    const title = rawTitle.trim()
    if (!title) return raw
    const label = (rawLabel?.trim() || shortSummaryDefaultLabel(title)).replace(/_/g, ' ')
    return label ? `**${label}**` : raw
  })
}
