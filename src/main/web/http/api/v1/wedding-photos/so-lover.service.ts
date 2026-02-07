import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

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

    const base64 = image.toString('base64')
    const testDataUrl = `data:image/jpeg;base64,${base64}`

    const prompt = `
Tu es un validateur du jeu So Clover.

Tu reçois 2 images :
- Image 1 = la référence (plateau correct)
- Image 2 = la photo à valider

Tâche :
Compare l'image 2 à l'image 1 et décide, pour chaque position (haut, droite, bas, gauche),
si la carte correspondante est placée et orientée de la même façon que sur la référence.

Sortie attendue :
- UNIQUEMENT du JSON (pas de markdown, pas d'explication)
- Format exact :
{
  "result": { "haut": true|false, "droite": true|false, "bas": true|false, "gauche": true|false }
}

Règle importante :
Si tu n’es pas sûr (photo floue, reflet, angle), renvoie false pour la position concernée.
`.trim()

    const payload = {
      model: 'gpt-4.1-mini',
      temperature: 0,
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

            // image 1 : référence (URL publique)
            { type: 'input_image', image_url: this.REFERENCE_URL },

            // image 2 : photo prise (data URL)
            { type: 'input_image', image_url: testDataUrl }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`OpenAI request: model=gpt-4.1-mini imageBytes=${image.length} ref=${this.REFERENCE_URL}`)

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

    const text = this.stripJson(rawText)

    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch (e: any) {
      this.logger.error(`JSON.parse failed: ${(e?.message ?? e) as string}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`Unparseable JSON (truncated): ${String(text).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

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
    if (i !== -1 && j !== -1) return t.slice(i, j + 1)
    return t
  }
}
