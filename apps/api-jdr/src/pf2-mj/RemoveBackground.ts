import { HttpException, HttpStatus } from '@nestjs/common'

const api = 'https://api.remove.bg/v1.0'
const maxBytes = 10 * 1024 * 1024
let inProgress = false
// remove.bg warns that account balances can lag several seconds.
// Reserve each attempted call locally during that window.
let recentBudget: { remaining: number; expires: number } | undefined

export async function removePortraitBackground(bytes: Uint8Array, mime: string, key = process.env.REMOVE_BG_API_KEY?.trim(), request = fetch): Promise<Buffer> {
  if (!key) throw new HttpException('Remove BG : clé API non configurée.', HttpStatus.SERVICE_UNAVAILABLE)
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime) || !bytes.length || bytes.length > maxBytes)
    throw new HttpException('Image PNG, JPEG ou WebP de 10 Mo maximum requise.', HttpStatus.BAD_REQUEST)
  if (inProgress) throw new HttpException('Un détourage est déjà en cours. Réessaie dans un instant.', HttpStatus.TOO_MANY_REQUESTS)
  inProgress = true
  try {
    const headers = { 'X-API-Key': key }
    const account = await request(api + '/account', { headers, signal: AbortSignal.timeout(10000) })
    if (!account.ok) throw new HttpException('Remove BG : impossible de vérifier le quota gratuit.', HttpStatus.BAD_GATEWAY)
    const quota = (await account.json())?.data?.attributes?.api?.free_calls
    if (typeof quota !== 'number' || !Number.isFinite(quota) || quota < 1)
      throw new HttpException('Remove BG : quota gratuit épuisé ou indisponible. Aucun crédit payant utilisé.', HttpStatus.TOO_MANY_REQUESTS)
    const remaining = recentBudget && recentBudget.expires > Date.now()
      ? Math.min(quota, recentBudget.remaining) : quota
    if (remaining < 1)
      throw new HttpException('Remove BG : quota gratuit épuisé ou en cours d’actualisation.', HttpStatus.TOO_MANY_REQUESTS)
    recentBudget = { remaining: remaining - 1, expires: Date.now() + 60_000 }
    const form = new FormData()
    form.set('image_file', new Blob([Buffer.from(bytes)], { type: mime }), 'portrait')
    form.set('size', 'preview')
    form.set('format', 'png')
    const response = await request(api + '/removebg', { method: 'POST', headers, body: form, signal: AbortSignal.timeout(45000) })
    if (!response.ok) throw new HttpException('Remove BG : détourage refusé ou indisponible.', HttpStatus.BAD_GATEWAY)
    const result = Buffer.from(await response.arrayBuffer())
    if (response.headers.get('content-type')?.split(';')[0] !== 'image/png' || result.length < 8 || !result.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      throw new HttpException('Remove BG : réponse image invalide.', HttpStatus.BAD_GATEWAY)
    return result
  } catch (error) {
    if (error instanceof HttpException) throw error
    throw new HttpException('Remove BG : service indisponible.', HttpStatus.BAD_GATEWAY)
  } finally { inProgress = false }
}
