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

    this.logger.log(`OpenAI request: model=gpt-4.1-mini imageBytes=${image.length}`)
    this.logger.debug?.(`Expected (normed): ${JSON.stringify(this.EXPECTED)}`)

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
      this.logger.error(`OpenAI error body (truncated): ${(txt || '').slice(0, 2000)}`)
      throw new InternalServerErrorException((txt || '').slice(0, 2000))
    }

    const data: any = await r.json()

    // --- logs bruts côté "Responses API" (sans l'image) ---
    this.logger.debug?.(
      `OpenAI meta: has_output_text=${Boolean(data?.output_text)} output_len=${
        Array.isArray(data?.output) ? data.output.length : 0
      }`
    )

    const rawText =
      data.output_text ??
      data.output
        ?.flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n') ??
      ''

    this.logger.log(`Model rawText length=${rawText.length}`)
    this.logger.log(`Model rawText (truncated): ${String(rawText).slice(0, 1200)}`)

    const text = this.stripJson(rawText)

    this.logger.log(`Model JSON length=${text.length}`)
    this.logger.log(`Model JSON (truncated): ${String(text).slice(0, 1200)}`)

    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch (e: any) {
      this.logger.error(`JSON.parse failed: ${(e?.message ?? e) as string}`)
      this.logger.error(`Unparseable JSON (truncated): ${String(text).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    // --- log de ce que le modèle a réellement donné pour tiles ---
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

    return { ok: true, result }
  }

  private compare(side: keyof typeof this.EXPECTED, parsed: any) {
    const expected = this.EXPECTED[side]
    const actual = parsed?.tiles?.[side] ?? {}

    // logs détaillés pour comprendre pourquoi ça peut être false
    const pairs = Object.entries(expected).map(([k, v]) => {
      const gotRaw = actual?.[k]
      const gotNorm = this.norm(gotRaw)
      const ok = gotNorm === v

      this.logger.log(
        `[compare:${side}] petale=${k} expected="${v}" gotRaw="${gotRaw ?? null}" gotNorm="${gotNorm}" ok=${ok}`
      )

      return ok
    })

    const okAll = pairs.every(Boolean)
    this.logger.log(`[compare:${side}] => ${okAll}`)
    return okAll
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
    const t = String(text ?? '').trim()

    // LOG: détecte les fences
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
