export async function removeBackgroundFromUrl(url: string): Promise<File> {
  const source = await fetch(url, { cache: 'no-store' })
  if (!source.ok) throw new Error('Impossible de lire le portrait original.')
  const blob = await source.blob()
  const form = new FormData()
  form.set('file', blob, 'portrait')
  const response = await fetch('/apil7r/pf2-mj/portraits/remove-background', { method: 'POST', body: form })
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || 'Impossible de supprimer le fond.')
  }
  return new File([await response.blob()], 'portrait-sans-fond.png', { type: 'image/png' })
}
