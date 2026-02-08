import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

type Side = 'haut' | 'droite' | 'bas' | 'gauche'
type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'
type Orientation = 'haut' | 'bas' | 'gauche' | 'droite'

const WORD_ENUM = ['court', 'boisson', 'couche', 'diable', 'ete', 'espece', 'bouche', 'bassin'] as const

const FIXED_WORDS = ['levre', 'biberon', 'succube', 'crapaud'] as const
const MOBILE_ANCHORS = ['bouche', 'boisson', 'diable', 'espece'] as const

const SIDE_ENUM: Side[] = ['haut', 'droite', 'bas', 'gauche']
const QUADRANT_ENUM: Quadrant[] = ['haut_gauche', 'haut_droite', 'bas_gauche', 'bas_droite']
const ORIENTATION_ENUM: Orientation[] = ['haut', 'bas', 'gauche', 'droite']

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  // 👉 ADAPTABLE
  private EXPECTED_FIXED: Record<(typeof FIXED_WORDS)[number], Side> = {
    levre: 'haut',
    biberon: 'droite',
    succube: 'bas',
    crapaud: 'gauche'
  }

  // 👉 ADAPTABLE
  private EXPECTED_ANCHORS: Record<(typeof MOBILE_ANCHORS)[number], { quadrant: Quadrant; orientation: Orientation }> =
    {
      bouche: { quadrant: 'haut_gauche', orientation: 'haut' },
      boisson: { quadrant: 'haut_droite', orientation: 'gauche' },
      diable: { quadrant: 'bas_droite', orientation: 'bas' },
      espece: { quadrant: 'bas_gauche', orientation: 'droite' }
    }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const base64 = image.toString('base64')
    const prompt = this.buildPrompt()

    const payload = {
      model: 'gpt-4.1-mini',
      temperature: 0,
      text: {
        format: {
          type: 'json_schema',
          name: 'so_clover_full_read',
          strict: true,
          schema: this.schema()
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
    this.logger.log(`[board] OpenAI request bytes≈${image.length}`)
    this.logger.log(
      `[board] Expected fixed=${JSON.stringify(this.EXPECTED_FIXED)} anchors=${JSON.stringify(this.EXPECTED_ANCHORS)}`
    )

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const dt = Date.now() - start
    this.logger.log(`[board] OpenAI response status=${r.status} ok=${r.ok} dt=${dt}ms`)

    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] OpenAI error body (truncated): ${(txt || '').slice(0, 2000)}`)
      throw new InternalServerErrorException('OpenAI error')
    }

    const data: any = await r.json()

    const raw =
      data.output_text ??
      data.output
        ?.flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n') ??
      ''

    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[board] rawText (truncated): ${String(raw).slice(0, 900)}`)

    let parsed: any
    try {
      parsed = JSON.parse(this.stripJson(raw))
    } catch (e: any) {
      this.logger.error(`[board] JSON.parse failed: ${(e?.message ?? e) as string}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] rawText (truncated): ${String(raw).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    return this.postProcess(parsed)
  }

  private postProcess(parsed: any) {
    const fixed = parsed?.fixed ?? null
    const mobile = parsed?.mobile ?? null

    this.logger.log(`[board] Parsed.fixed: ${JSON.stringify(fixed)}`)
    this.logger.log(`[board] Parsed.mobile: ${JSON.stringify(mobile)}`)

    // --- 1) compare FIXED ---
    const fixedOk: Record<(typeof FIXED_WORDS)[number], boolean> = {
      levre: false,
      biberon: false,
      succube: false,
      crapaud: false
    }

    for (const word of FIXED_WORDS) {
      const expected = this.EXPECTED_FIXED[word]
      const got = fixed?.[word] ?? null
      const ok = got === expected

      fixedOk[word] = ok
      this.logger.log(`[compare:fixed] ${word} expected=${expected} got=${got} ok=${ok}`)
    }

    // --- 2) compare ANCHORS ---
    const anchorOk: Record<(typeof MOBILE_ANCHORS)[number], boolean> = {
      bouche: false,
      boisson: false,
      diable: false,
      espece: false
    }

    for (const a of MOBILE_ANCHORS) {
      const exp = this.EXPECTED_ANCHORS[a]
      const got = mobile?.[a] ?? null

      const ok = got && got.quadrant === exp.quadrant && got.orientation === exp.orientation

      anchorOk[a] = Boolean(ok)

      this.logger.log(
        `[compare:anchor] ${a} expected=${JSON.stringify(exp)} got=${JSON.stringify(got)} ok=${Boolean(ok)}`
      )
    }

    // --- 3) resultBySide (comme ton front actuel) ---
    const resultBySide: Record<Side, boolean> = {
      haut: fixedOk.levre,
      droite: fixedOk.biberon,
      bas: fixedOk.succube,
      gauche: fixedOk.crapaud
    }

    // log récap utile
    this.logger.log(
      `[board] Summary fixedOk=${JSON.stringify(fixedOk)} anchorsOk=${JSON.stringify(
        anchorOk
      )} resultBySide=${JSON.stringify(resultBySide)}`
    )

    return {
      ok: true,
      result: resultBySide, // compatible front actuel
      anchors: anchorOk, // prêt pour front futur
      raw: { fixed, mobile } // debug
    }
  }

  private buildPrompt() {
    return `
Tu analyses UNE photo du jeu So Clover.

Il y a 4 MOTS FIXES écrits à la main (et TOUJOURS les mêmes) :
${FIXED_WORDS.join(', ')}

Ces 4 mots fixes sont chacun placés UNE seule fois sur un des côtés du trèfle :
haut / droite / bas / gauche

Il y a aussi 4 CARTES MOBILES roses.
Chaque carte mobile contient 4 mots imprimés parmi la liste :
${WORD_ENUM.join(', ')}

Chaque carte mobile contient EXACTEMENT un mot "anchor" parmi :
${MOBILE_ANCHORS.join(', ')}

Tâches :

1) Donne la position (haut/droite/bas/gauche) de chacun des 4 mots fixes.

2) Pour chaque anchor (bouche, boisson, diable, espece), donne :
- quadrant de la carte mobile : haut_gauche / haut_droite / bas_gauche / bas_droite
- orientation du mot anchor DANS la carte : haut / droite / bas / gauche

Règles :
- Tu dois fournir une réponse complète (toutes les clés).
- Si un élément est incertain : renvoie null (mais garde les clés).
- Réponds uniquement en JSON.
`.trim()
  }

  private schema() {
    // NB: additionalProperties:false PARTOUT (root + nested objects)
    return {
      type: 'object',
      additionalProperties: false,
      required: ['fixed', 'mobile'],
      properties: {
        fixed: {
          type: 'object',
          additionalProperties: false,
          required: [...FIXED_WORDS],
          properties: {
            levre: { anyOf: [{ type: 'string', enum: SIDE_ENUM }, { type: 'null' }] },
            biberon: { anyOf: [{ type: 'string', enum: SIDE_ENUM }, { type: 'null' }] },
            succube: { anyOf: [{ type: 'string', enum: SIDE_ENUM }, { type: 'null' }] },
            crapaud: { anyOf: [{ type: 'string', enum: SIDE_ENUM }, { type: 'null' }] }
          }
        },
        mobile: {
          type: 'object',
          additionalProperties: false,
          required: [...MOBILE_ANCHORS],
          properties: {
            bouche: this.mobileSchema(),
            boisson: this.mobileSchema(),
            diable: this.mobileSchema(),
            espece: this.mobileSchema()
          }
        }
      }
    }
  }

  private mobileSchema() {
    // ✅ Fix erreur: additionalProperties:false requis ici aussi
    return {
      type: 'object',
      additionalProperties: false,
      required: ['quadrant', 'orientation'],
      properties: {
        quadrant: { anyOf: [{ type: 'string', enum: QUADRANT_ENUM }, { type: 'null' }] },
        orientation: { anyOf: [{ type: 'string', enum: ORIENTATION_ENUM }, { type: 'null' }] }
      }
    }
  }

  private stripJson(text: string) {
    const t = String(text ?? '').trim()
    if (t.startsWith('```')) {
      return t
        .replace(/^```[a-z]*\n/, '')
        .replace(/\n```$/, '')
        .trim()
    }
    const i = t.indexOf('{')
    const j = t.lastIndexOf('}')
    // eslint-disable-next-line no-magic-numbers
    if (i !== -1 && j !== -1) return t.slice(i, j + 1)
    return t
  }
}
