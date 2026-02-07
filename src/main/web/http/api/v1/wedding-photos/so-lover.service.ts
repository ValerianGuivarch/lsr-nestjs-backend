import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

type Petal = 'levre' | 'biberon' | 'succube' | 'crapaud'
type Tile = 'haut' | 'droite' | 'bas' | 'gauche'

type ReadWord = { raw: string | null; norm: string | null }

type ModelShape = {
  tiles: Record<Tile, { petales: Partial<Record<Petal, ReadWord>> }>
}

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)
  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private readonly EXPECTED: Record<Tile, Partial<Record<Petal, string>>> = {
    haut: { biberon: 'boisson', levre: 'court' },
    droite: { biberon: 'couche', succube: 'diable' },
    bas: { succube: 'ete', crapaud: 'espece' },
    gauche: { levre: 'bouche', crapaud: 'bassin' }
  }

  async validateSoClover(image: Buffer): Promise<{
    ok: true
    result: Record<Tile, { ok: boolean; details: Record<string, { expected: string; found: string | null }> }>
  }> {
    const t0 = Date.now()

    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY is missing')

    const dataUrl = `data:image/jpeg;base64,${image.toString('base64')}`
    this.logger.log(`OpenAI request: model=gpt-4.1-mini imageBytes=${image.length}`)

    const prompt = PROMPT

    const payload = {
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: dataUrl }
          ]
        }
      ]
    }

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    this.logger.log(`OpenAI response: status=${r.status} ok=${r.ok} dt=${Date.now() - t0}ms`)

    if (!r.ok) {
      const errText = await r.text().catch(() => '')
      // eslint-disable-next-line no-magic-numbers
      throw new InternalServerErrorException(`OpenAI error: ${r.status} ${(errText || '').slice(0, 1200)}`)
    }

    const data: any = await r.json()

    const text: string =
      data.output_text ??
      (Array.isArray(data.output)
        ? data.output
            .flatMap((o: any) => o.content || [])
            .filter((c: any) => c.type === 'output_text')
            .map((c: any) => c.text)
            .join('\n')
        : '')

    const textTrim = (text ?? '').trim()
    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`OpenAI output_text (truncated): ${textTrim.slice(0, 600)}`)

    let parsed: ModelShape
    try {
      parsed = JSON.parse(textTrim)
    } catch {
      // eslint-disable-next-line no-magic-numbers
      throw new InternalServerErrorException(`Model did not return JSON: ${textTrim.slice(0, 800)}`)
    }

    const result = (['haut', 'droite', 'bas', 'gauche'] as Tile[]).reduce((acc, tile) => {
      const expected = this.EXPECTED[tile]
      const got = parsed?.tiles?.[tile]?.petales ?? {}

      const details: Record<string, { expected: string; found: string | null }> = {}
      let ok = true

      for (const [petal, expectedWord] of Object.entries(expected)) {
        const foundNorm = normalize((got as any)[petal]?.norm ?? (got as any)[petal]?.raw ?? null)
        details[petal] = { expected: expectedWord as string, found: foundNorm }

        if (!foundNorm || foundNorm !== expectedWord) ok = false
      }

      acc[tile] = { ok, details }
      return acc
    }, {} as Record<Tile, { ok: boolean; details: Record<string, { expected: string; found: string | null }> }>)

    this.logger.log(
      `Validate tiles: haut=${result.haut.ok} droite=${result.droite.ok} bas=${result.bas.ok} gauche=${
        result.gauche.ok
      } dt=${Date.now() - t0}ms`
    )

    return { ok: true, result }
  }
}

const PROMPT = `
Tu es un validateur visuel du jeu So Clover.

Sur la photo, les 4 mots manuscrits sur les pétales verts sont toujours:
- LEVRE
- BIBERON
- SUCCUBE
- CRAPAUD

Ta tâche: pour chacune des 4 cartes (haut, droite, bas, gauche), identifier les 2 mots IMPRIMÉS sur les côtés externes de la carte, et dire quel mot imprimé est du côté de quel pétale manuscrit adjacent.

Définitions:
- "carte du haut" = la carte située en haut du trèfle (entre 2 pétales adjacents).
- "carte de droite" = située à droite
- "carte du bas" = située en bas
- "carte de gauche" = située à gauche

Chaque carte touche 2 pétales manuscrits: tu dois donner une paire (petale -> mot imprimé).

Contraintes:
- Retourne UNIQUEMENT un JSON strict, aucun texte autour.
- Ne devine pas: si illisible, mets null.
- Fournis "raw" (tel que lu) et "norm" (minuscules, sans accents, sans ponctuation).

JSON EXACT:
{
  "tiles": {
    "haut":   { "petales": { "<petale1>": {"raw":string|null,"norm":string|null}, "<petale2>": {"raw":string|null,"norm":string|null} } },
    "droite": { "petales": { "<petale1>": {"raw":string|null,"norm":string|null}, "<petale2>": {"raw":string|null,"norm":string|null} } },
    "bas":    { "petales": { "<petale1>": {"raw":string|null,"norm":string|null}, "<petale2>": {"raw":string|null,"norm":string|null} } },
    "gauche": { "petales": { "<petale1>": {"raw":string|null,"norm":string|null}, "<petale2>": {"raw":string|null,"norm":string|null} } }
  }
}

IMPORTANT:
- Les clés <petale1>/<petale2> doivent être exactement l’un de: "levre","biberon","succube","crapaud"
- Dans chaque tuile, il doit y avoir exactement 2 pétales (les 2 voisins de la carte).
`.trim()

function normalize(s: string | null): string | null {
  if (!s) return null
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}
