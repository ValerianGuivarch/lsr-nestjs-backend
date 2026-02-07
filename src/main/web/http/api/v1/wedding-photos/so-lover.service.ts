import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private EXPECTED = {
    haut: { levre: 'court', biberon: 'boisson' },
    droite: { biberon: 'couche', succube: 'diable' },
    bas: { succube: 'costume', crapaud: 'epee' },
    gauche: { levre: 'bouche', crapaud: 'bassin' }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const base64 = image.toString('base64')

    const prompt = `
Tu es un validateur So Clover.

IMPORTANT:
Les mots manuscrits sont FIXES et connus:
- haut: levre / biberon
- droite: biberon / succube
- bas: succube / crapaud
- gauche: levre / crapaud

Tu dois UNIQUEMENT lire les mots imprimés sur les cartes roses.

Pour chaque carte:
Retourne le mot imprimé qui touche chaque pétale manuscrit.

Réponds UNIQUEMENT en JSON strict.
Pas de markdown.
Pas d'explication.

FORMAT EXACT:

{
  "tiles": {
    "haut": { "levre": "...", "biberon": "..." },
    "droite": { "biberon": "...", "succube": "..." },
    "bas": { "succube": "...", "crapaud": "..." },
    "gauche": { "levre": "...", "crapaud": "..." }
  }
}
`

    const payload = {
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            {
              type: 'input_image',
              image_url: `data:image/jpeg;base64,${base64}`
            }
          ]
        }
      ]
    }

    const start = Date.now()

    this.logger.log(`OpenAI request imageBytes=${image.length}`)

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const dt = Date.now() - start
    this.logger.log(`OpenAI response status=${r.status} dt=${dt}ms`)

    if (!r.ok) {
      const txt = await r.text()
      throw new InternalServerErrorException(txt)
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

    const text = this.stripJson(rawText)

    this.logger.log(`Model JSON length=${text.length}`)

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      this.logger.error(text)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    const result = {
      haut: this.compare('haut', parsed),
      droite: this.compare('droite', parsed),
      bas: this.compare('bas', parsed),
      gauche: this.compare('gauche', parsed)
    }

    return { ok: true, result }
  }

  private compare(side: keyof typeof this.EXPECTED, parsed: any) {
    const expected = this.EXPECTED[side]
    const actual = parsed?.tiles?.[side] ?? {}

    return Object.entries(expected).every(([k, v]) => this.norm(actual[k]) === v)
  }

  private norm(s?: string) {
    if (!s) return ''
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '')
  }

  private stripJson(text: string) {
    const t = text.trim()

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
