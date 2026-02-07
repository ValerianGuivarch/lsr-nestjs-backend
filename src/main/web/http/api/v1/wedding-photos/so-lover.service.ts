import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

type Side = 'haut' | 'droite' | 'bas' | 'gauche'

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private readonly REFERENCE_URL = 'https://l7r.fr/l7r/resultat.png'

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    // 1) Charger la référence côté NAS (au lieu de laisser OpenAI la télécharger)
    const ref = await this.loadReferenceAsDataUrl()

    // 2) Photo test (data URL)
    const testDataUrl = `data:image/jpeg;base64,${image.toString('base64')}`

    const prompt = `
Tu es un validateur du jeu So Clover.

Tu reçois 2 images :
- Image 1 = la référence (plateau correct)
- Image 2 = la photo à valider

Compare l'image 2 à l'image 1 et décide, pour chaque position (haut, droite, bas, gauche),
si la carte correspondante est placée et orientée de la même façon que sur la référence.

Réponds UNIQUEMENT en JSON strict :
{
  "result": { "haut": true|false, "droite": true|false, "bas": true|false, "gauche": true|false }
}

Si tu n’es pas sûr (flou, reflet, angle), renvoie false pour la position concernée.
`.trim()

    const payload = {
      model: 'gpt-4.1-mini',
      temperature: 0,
      // NOTE: si ton compte ne supporte pas json_schema ici, on enlèvera text.format.
      text: {
        format: {
          type: 'json_schema',
          name: 'so_clover_compare',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['result'],
            properties: {
              result: {
                type: 'object',
                additionalProperties: false,
                required: ['haut', 'droite', 'bas', 'gauche'],
                properties: {
                  haut: { type: 'boolean' },
                  droite: { type: 'boolean' },
                  bas: { type: 'boolean' },
                  gauche: { type: 'boolean' }
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

            // image 1 : référence (base64)
            { type: 'input_image', image_url: ref },

            // image 2 : photo à valider
            { type: 'input_image', image_url: testDataUrl }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`OpenAI request: model=gpt-4.1-mini imageBytes=${image.length} refUrl=${this.REFERENCE_URL}`)

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
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

    this.logger.log(`Model rawText length=${rawText.length}`)
    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`Model rawText (truncated): ${String(rawText).slice(0, 1200)}`)

    const parsed = JSON.parse(this.stripJson(rawText))
    const result: Record<Side, boolean> = parsed?.result

    this.logger.log(`Parsed.result: ${JSON.stringify(result ?? null)}`)

    if (
      !result ||
      typeof result.haut !== 'boolean' ||
      typeof result.droite !== 'boolean' ||
      typeof result.bas !== 'boolean' ||
      typeof result.gauche !== 'boolean'
    ) {
      throw new InternalServerErrorException('Model returned unexpected JSON shape')
    }

    return { ok: true, result }
  }

  private readonly REFERENCE_LOCAL_PATH = '/volume1/homes/Valou/lsr-nestjs-backend/src/assets/so-lover/resultat.png'

  private async loadReferenceAsDataUrl(): Promise<string> {
    const start = Date.now()
    this.logger.log(`Loading reference from local file ${this.REFERENCE_LOCAL_PATH}`)

    let buf: Buffer
    try {
      buf = await readFile(this.REFERENCE_LOCAL_PATH)
    } catch (e: any) {
      this.logger.error(`Cannot read reference file: ${e?.message ?? e}`)
      throw new InternalServerErrorException('Cannot read reference image on server')
    }

    const dt = Date.now() - start
    const ext = extname(this.REFERENCE_LOCAL_PATH).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream'

    this.logger.log(`Reference loaded: bytes=${buf.length} contentType=${contentType} dt=${dt}ms`)

    return `data:${contentType};base64,${buf.toString('base64')}`
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
