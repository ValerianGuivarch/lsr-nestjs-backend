import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

type Side = 'haut' | 'droite' | 'bas' | 'gauche'
type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'
type Orientation = 'haut' | 'bas' | 'gauche' | 'droite'

const WORD_ENUM = ['court', 'boisson', 'couche', 'diable', 'ete', 'espece', 'bouche', 'bassin'] as const

const FIXED_WORDS = ['levre', 'biberon', 'succube', 'crapaud'] as const

const MOBILE_ANCHORS = ['bouche', 'boisson', 'diable', 'espece'] as const

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  // 👉 ADAPTABLE
  private EXPECTED_FIXED: Record<string, Side> = {
    levre: 'haut',
    biberon: 'droite',
    succube: 'bas',
    crapaud: 'gauche'
  }

  // 👉 ADAPTABLE
  private EXPECTED_ANCHORS: Record<string, { quadrant: Quadrant; orientation: Orientation }> = {
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

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const dt = Date.now() - start
    this.logger.log(`[board] OpenAI response status=${r.status} ok=${r.ok} dt=${dt}ms`)

    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(txt.slice(0, 2000))
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
    this.logger.log(`[board] rawText (truncated): ${raw.slice(0, 600)}`)

    const parsed = JSON.parse(raw)

    return this.postProcess(parsed)
  }

  private postProcess(parsed: any) {
    const fixed = parsed.fixed ?? {}
    const mobile = parsed.mobile ?? {}

    this.logger.log(`[board] Fixed detected: ${JSON.stringify(fixed)}`)
    this.logger.log(`[board] Mobile detected: ${JSON.stringify(mobile)}`)

    const fixedOk: Record<string, boolean> = {}
    for (const word of FIXED_WORDS) {
      const expected = this.EXPECTED_FIXED[word]
      const got = fixed[word]
      const ok = got === expected

      fixedOk[word] = ok

      this.logger.log(`[compare:fixed] ${word} expected=${expected} got=${got} ok=${ok}`)
    }

    const anchorOk: Record<string, boolean> = {}
    for (const a of MOBILE_ANCHORS) {
      const exp = this.EXPECTED_ANCHORS[a]
      const got = mobile[a]

      const ok = got && got.quadrant === exp.quadrant && got.orientation === exp.orientation

      anchorOk[a] = !!ok

      this.logger.log(`[compare:anchor] ${a} expected=${JSON.stringify(exp)} got=${JSON.stringify(got)} ok=${ok}`)
    }

    const resultBySide: Record<Side, boolean> = {
      haut: fixedOk.levre ?? false,
      droite: fixedOk.biberon ?? false,
      bas: fixedOk.succube ?? false,
      gauche: fixedOk.crapaud ?? false
    }

    this.logger.log(`[board] Result by side: ${JSON.stringify(resultBySide)}`)
    this.logger.log(`[board] Result anchors: ${JSON.stringify(anchorOk)}`)

    return {
      ok: true,
      result: resultBySide,
      anchors: anchorOk,
      raw: { fixed, mobile }
    }
  }

  private buildPrompt() {
    return `
Tu analyses UNE photo du jeu So Clover.

Il y a sur la photo :

4 mots fixes :
${FIXED_WORDS.join(', ')}

Ils sont chacun placés UNE seule fois sur :
haut / bas / gauche / droite

---

4 cartes mobiles.
Chaque carte contient 4 mots parmi :
${WORD_ENUM.join(', ')}

Chaque carte contient exactement un mot anchor :
${MOBILE_ANCHORS.join(', ')}

---

Tâches :

1) Trouver la position des mots fixes
2) Pour chaque anchor :
- quadrant = haut_gauche / haut_droite / bas_gauche / bas_droite
- orientation = haut / bas / gauche / droite

Si incertain → null.

Réponds uniquement en JSON.
`
  }

  private schema() {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['fixed', 'mobile'],
      properties: {
        fixed: {
          type: 'object',
          additionalProperties: false,
          required: ['levre', 'biberon', 'succube', 'crapaud'],
          properties: {
            levre: { type: 'string', enum: ['haut', 'bas', 'gauche', 'droite'] },
            biberon: { type: 'string', enum: ['haut', 'bas', 'gauche', 'droite'] },
            succube: { type: 'string', enum: ['haut', 'bas', 'gauche', 'droite'] },
            crapaud: { type: 'string', enum: ['haut', 'bas', 'gauche', 'droite'] }
          }
        },
        mobile: {
          type: 'object',
          additionalProperties: false,
          required: ['bouche', 'boisson', 'diable', 'espece'],
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
    return {
      type: 'object',
      required: ['quadrant', 'orientation'],
      properties: {
        quadrant: { type: 'string' },
        orientation: { type: 'string' }
      }
    }
  }
}
