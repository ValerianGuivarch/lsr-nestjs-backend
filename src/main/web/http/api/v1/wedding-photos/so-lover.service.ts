import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

type Side = 'haut' | 'droite' | 'bas' | 'gauche'
type Petal = 'levre' | 'biberon' | 'succube' | 'crapaud'

const WORD_ENUM = ['court', 'boisson', 'couche', 'diable', 'été', 'espèce', 'bouche', 'bassin'] as const

type Word = (typeof WORD_ENUM)[number]

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private EXPECTED: Record<Side, Partial<Record<Petal, Word>>> = {
    haut: { levre: 'court', biberon: 'boisson' },
    droite: { biberon: 'couche', succube: 'diable' },
    bas: { succube: 'été', crapaud: 'espèce' },
    gauche: { levre: 'bouche', crapaud: 'bassin' }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const base64 = image.toString('base64')

    const prompt = `
Tu es un validateur So Clover.

Les mots manuscrits sont FIXES et connus:
- haut: levre / biberon
- droite: biberon / succube
- bas: succube / crapaud
- gauche: levre / crapaud

Tu dois UNIQUEMENT lire les mots imprimés sur les cartes roses.
Pour chaque carte, retourne le mot imprimé qui TOUCHE chaque pétale manuscrit.

IMPORTANT:
- Tu n'as le droit de répondre que par l'un des mots autorisés (enum) ou null si illisible.
- Ne devine pas.
`.trim()

    const payload = {
      model: 'gpt-4.1-mini',
      temperature: 0,
      // Structured outputs (bloque "Menthe"/"Palix"/etc.)
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'so_clover_validator',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['tiles'],
            properties: {
              tiles: {
                type: 'object',
                additionalProperties: false,
                required: ['haut', 'droite', 'bas', 'gauche'],
                properties: {
                  haut: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['levre', 'biberon'],
                    properties: {
                      levre: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] },
                      biberon: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] }
                    }
                  },
                  droite: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['biberon', 'succube'],
                    properties: {
                      biberon: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] },
                      succube: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] }
                    }
                  },
                  bas: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['succube', 'crapaud'],
                    properties: {
                      succube: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] },
                      crapaud: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] }
                    }
                  },
                  gauche: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['levre', 'crapaud'],
                    properties: {
                      levre: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] },
                      crapaud: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: `data:image/jpeg;base64,${base64}` }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`OpenAI request: model=gpt-4.1-mini imageBytes=${image.length}`)
    this.logger.log(`Expected: ${JSON.stringify(this.EXPECTED)}`)

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const dt = Date.now() - start
    this.logger.log(`OpenAI response: status=${r.status} ok=${r.ok} dt=${dt}ms`)

    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`OpenAI error body (truncated): ${(txt || '').slice(0, 2000)}`)
      // eslint-disable-next-line no-magic-numbers
      throw new InternalServerErrorException((txt || '').slice(0, 2000))
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

    // Avec structured outputs, ça devrait être déjà propre, mais on log quand même
    this.logger.log(`Model rawText length=${rawText.length}`)
    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`Model rawText (truncated): ${String(rawText).slice(0, 1200)}`)

    const text = this.stripJson(rawText)

    this.logger.log(`Model JSON length=${text.length}`)
    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`Model JSON (truncated): ${String(text).slice(0, 1200)}`)

    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch (e: any) {
      this.logger.error(`JSON.parse failed: ${(e?.message ?? e) as string}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`Unparseable JSON (truncated): ${String(text).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    this.logger.log(`Parsed.tiles: ${JSON.stringify(parsed?.tiles ?? null)}`)

    const result = {
      haut: this.compare('haut', parsed),
      droite: this.compare('droite', parsed),
      bas: this.compare('bas', parsed),
      gauche: this.compare('gauche', parsed)
    }

    this.logger.log(
      `Final result: haut=${result.haut} droite=${result.droite} bas=${result.bas} gauche=${result.gauche}`
    )

    return { ok: true, result, tiles: parsed?.tiles ?? null }
  }

  private compare(side: Side, parsed: any) {
    const expected = this.EXPECTED[side]
    const actual = parsed?.tiles?.[side] ?? {}

    const oks = Object.entries(expected).map(([petal, exp]) => {
      const gotRaw = actual?.[petal]
      const gotNorm = this.norm(gotRaw)
      const ok = gotNorm === exp

      this.logger.log(
        `[compare:${side}] petale=${petal} expected="${exp}" gotRaw="${gotRaw ?? null}" gotNorm="${gotNorm}" ok=${ok}`
      )
      return ok
    })

    const okAll = oks.every(Boolean)
    this.logger.log(`[compare:${side}] => ${okAll}`)
    return okAll
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

    if (t.startsWith('```')) {
      this.logger.warn('Model returned fenced JSON (```...). Stripping fences.')
      return t
        .replace(/^```[a-z]*\n/, '')
        .replace(/\n```$/, '')
        .trim()
    }

    const i = t.indexOf('{')
    const j = t.lastIndexOf('}')
    // eslint-disable-next-line no-magic-numbers
    if (i !== -1 && j !== -1) {
      if (i !== 0 || j !== t.length - 1) {
        this.logger.warn('Model returned JSON with extra text. Extracting {...} substring.')
      }
      return t.slice(i, j + 1)
    }

    this.logger.warn('Model output does not look like JSON. Returning as-is.')
    return t
  }
}
