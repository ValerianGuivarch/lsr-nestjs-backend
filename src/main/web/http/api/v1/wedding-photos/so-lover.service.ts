import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import sharp = require('sharp')

type Side = 'haut' | 'droite' | 'bas' | 'gauche'

const WORD_ENUM = ['court', 'boisson', 'couche', 'diable', 'ete', 'espece', 'bouche', 'bassin'] as const
type Word = (typeof WORD_ENUM)[number]

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)
  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private EXPECTED: Record<Side, Record<string, Word>> = {
    haut: { levre: 'court', biberon: 'boisson' },
    droite: { biberon: 'couche', succube: 'diable' },
    bas: { succube: 'ete', crapaud: 'espece' },
    gauche: { levre: 'bouche', crapaud: 'bassin' }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    // 1) Préparer 4 crops (haut/droite/bas/gauche)
    const crops = await this.crop4Sides(image)

    // 2) Lire chaque crop indépendamment (ça évite l’effet domino)
    const tiles = {
      haut: await this.readTile('haut', crops.haut),
      droite: await this.readTile('droite', crops.droite),
      bas: await this.readTile('bas', crops.bas),
      gauche: await this.readTile('gauche', crops.gauche)
    }

    this.logger.log(`Tiles read: ${JSON.stringify(tiles)}`)

    // 3) Comparer localement
    const result: Record<Side, boolean> = {
      haut: this.compare('haut', tiles.haut),
      droite: this.compare('droite', tiles.droite),
      bas: this.compare('bas', tiles.bas),
      gauche: this.compare('gauche', tiles.gauche)
    }

    this.logger.log(`Final result: ${JSON.stringify(result)}`)

    return { ok: true, result, tiles } // tiles est super utile pour debug
  }

  /**
   * Crop "approx" en 4 zones.
   * Ça marche tant que le trèfle est à peu près centré dans la photo.
   */
  private async crop4Sides(image: Buffer): Promise<Record<Side, Buffer>> {
    const img = sharp(image).rotate()
    const meta = await img.metadata()
    const w = meta.width ?? 0
    const h = meta.height ?? 0
    if (!w || !h) throw new InternalServerErrorException('Invalid image')

    // eslint-disable-next-line no-magic-numbers
    const cx = w / 2
    // eslint-disable-next-line no-magic-numbers
    const cy = h / 2

    // eslint-disable-next-line no-magic-numbers
    const cw = Math.round(w * 0.55)
    // eslint-disable-next-line no-magic-numbers
    const ch = Math.round(h * 0.28)

    const boxes: Record<Side, { left: number; top: number; width: number; height: number }> = {
      // eslint-disable-next-line no-magic-numbers
      haut: { left: Math.round(cx - cw / 2), top: Math.round(h * 0.05), width: cw, height: ch },
      // eslint-disable-next-line no-magic-numbers
      bas: { left: Math.round(cx - cw / 2), top: Math.round(h * 0.67), width: cw, height: ch },
      gauche: {
        // eslint-disable-next-line no-magic-numbers
        left: Math.round(w * 0.02),
        // eslint-disable-next-line no-magic-numbers
        top: Math.round(cy - ch / 2),
        // eslint-disable-next-line no-magic-numbers
        width: Math.round(w * 0.4),
        // eslint-disable-next-line no-magic-numbers
        height: Math.round(h * 0.35)
      },
      droite: {
        // eslint-disable-next-line no-magic-numbers
        left: Math.round(w * 0.58),
        // eslint-disable-next-line no-magic-numbers
        top: Math.round(cy - ch / 2),
        // eslint-disable-next-line no-magic-numbers
        width: Math.round(w * 0.4),
        // eslint-disable-next-line no-magic-numbers
        height: Math.round(h * 0.35)
      }
    }

    const out: any = {}
    for (const side of Object.keys(boxes) as Side[]) {
      const b = boxes[side]

      const left = Math.max(0, Math.min(w - 1, b.left))
      const top = Math.max(0, Math.min(h - 1, b.top))
      const width = Math.max(1, Math.min(w - left, b.width))
      const height = Math.max(1, Math.min(h - top, b.height))

      const buf = await sharp(image)
        .rotate()
        .extract({ left, top, width, height })
        .resize({ width: 900, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer()

      this.logger.log(`[crop:${side}] box=${JSON.stringify({ left, top, width, height })} bytes=${buf.length}`)
      out[side] = buf
    }

    return out as Record<Side, Buffer>
  }

  /**
   * Lit les 2 mots imprimés sur la carte rose du côté + explique pourquoi.
   * L'explication sert UNIQUEMENT aux logs et n'est PAS renvoyée.
   */
  private async readTile(side: Side, tileJpeg: Buffer): Promise<any> {
    const expectedKeys = Object.keys(this.EXPECTED[side])

    const prompt = `
Tu regardes UNE SEULE carte rose du jeu So Clover (un côté du trèfle).

Les mots manuscrits à ignorer :
- haut: levre / biberon
- droite: biberon / succube
- bas: succube / crapaud
- gauche: levre / crapaud

Tâche:
Pour le côté "${side}", lis UNIQUEMENT les mots imprimés sur la carte rose,
et renvoie quel mot imprimé touche chaque pétale manuscrit de ce côté.

Tu n'as le droit de renvoyer que:
${WORD_ENUM.join(', ')} ou null si illisible.
Ne devine pas.

En plus, donne une explication courte (1-2 phrases) dans "why" :
- ce que tu as vu (orientation, lecture des mots),
- et si un mot est illisible, pourquoi (flou, reflet, angle).

Réponds UNIQUEMENT en JSON strict au format:
{
  "side": "${side}",
  "petals": { ${expectedKeys.map((k) => `"${k}": "..."`).join(', ')} },
  "why": "..."
}
`.trim()

    const schema = this.schemaForSide(side)

    const payload = {
      model: 'gpt-4.1-mini',
      temperature: 0,
      text: {
        format: {
          type: 'json_schema',
          name: `so_clover_tile_${side}`,
          strict: true,
          schema
        }
      },
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: `data:image/jpeg;base64,${tileJpeg.toString('base64')}` }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`[tile:${side}] OpenAI request bytes=${tileJpeg.length}`)

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const dt = Date.now() - start
    this.logger.log(`[tile:${side}] OpenAI response status=${r.status} ok=${r.ok} dt=${dt}ms`)

    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[tile:${side}] OpenAI error (truncated): ${(txt || '').slice(0, 1500)}`)
      throw new InternalServerErrorException(`OpenAI error on tile ${side}`)
    }

    const data: any = await r.json()

    const rawText =
      data.output_text ??
      data.output
        ?.flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n') ??
      ''

    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[tile:${side}] rawText: ${String(rawText).slice(0, 500)}`)

    const parsed = JSON.parse(this.stripJson(rawText))
    this.logger.log(`[tile:${side}] parsed: ${JSON.stringify(parsed)}`)
    this.logger.log(`[tile:${side}] expectedKeys=${JSON.stringify(Object.keys(this.EXPECTED[side]))}`)
    this.logger.log(`[tile:${side}] gotKeys=${JSON.stringify(Object.keys(parsed?.petals ?? {}))}`)
    // >>> LOG explication (sans renvoyer)
    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[tile:${side}] why: ${String(parsed?.why ?? '').slice(0, 800)}`)

    return parsed?.petals ?? {}
  }

  private compare(side: Side, petals: any): boolean {
    const expected = this.EXPECTED[side]
    const entries = Object.entries(expected)

    let okAll = true
    for (const [k, exp] of entries) {
      const got = petals?.[k]
      const gotNorm = this.norm(got)
      const ok = gotNorm === exp

      this.logger.log(`[compare:${side}] petal=${k} expected=${exp} gotRaw=${got ?? null} gotNorm=${gotNorm} ok=${ok}`)
      if (!ok) okAll = false
    }
    return okAll
  }

  private schemaForSide(side: Side) {
    const petalsForSide: Record<Side, string[]> = {
      haut: ['levre', 'biberon'],
      droite: ['biberon', 'succube'],
      bas: ['succube', 'crapaud'],
      gauche: ['levre', 'crapaud']
    }

    const keys = petalsForSide[side]

    const petalProps: Record<string, any> = {}
    for (const k of keys) {
      petalProps[k] = { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] }
    }

    return {
      type: 'object',
      additionalProperties: false,
      required: ['side', 'petals', 'why'],
      properties: {
        side: { type: 'string', enum: [side] },
        petals: {
          type: 'object',
          additionalProperties: false,
          required: keys,
          properties: petalProps
        },
        // explication log-only
        why: { type: 'string' }
      }
    }
  }

  private norm(s?: string | null) {
    if (!s) return ''
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '')
  }

  private stripJson(text: string) {
    const t = String(text ?? '').trim()
    if (t.startsWith('```'))
      return t
        .replace(/^```[a-z]*\n/, '')
        .replace(/\n```$/, '')
        .trim()
    const i = t.indexOf('{')
    const j = t.lastIndexOf('}')
    // eslint-disable-next-line no-magic-numbers
    if (i !== -1 && j !== -1) return t.slice(i, j + 1)
    return t
  }
}
