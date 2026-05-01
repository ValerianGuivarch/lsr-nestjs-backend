import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'

type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'

type QuadrantResult = { same: boolean; why: string }

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private REF_PATH = '/volume1/homes/Valou/lsr-nestjs-backend/src/assets/so-lover/resultat.png'

  // Mets à true si tu veux logger le raw COMPLET (souvent très long)
  private readonly RAW_LOG_FULL = false

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const refBuffer = await this.loadReference()

    const base64Test = image.toString('base64')
    const base64Ref = refBuffer.toString('base64')

    const payload = {
      model: 'gpt-4.1',
      temperature: 0,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: this.buildPrompt() },
            { type: 'input_image', image_url: `data:image/png;base64,${base64Ref}` },
            { type: 'input_image', image_url: `data:image/jpeg;base64,${base64Test}` }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(
      `[board] OpenAI request model=${payload.model} testBytes≈${image.length} refBytes≈${refBuffer.length} ref=${this.REF_PATH}`
    )

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
      this.logger.error(`[board] OpenAI error body: ${(txt || '').slice(0, 4000)}`)
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

    if (this.RAW_LOG_FULL) {
      this.logger.log(`[board] rawText FULL: ${raw}`)
    } else {
      // eslint-disable-next-line no-magic-numbers
      this.logger.log(`[board] rawText (truncated): ${String(raw).slice(0, 1200)}`)
    }

    let parsed: any
    try {
      parsed = JSON.parse(this.stripJson(raw))
    } catch (e: any) {
      this.logger.error(`[board] JSON.parse failed: ${e?.message ?? e}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] rawText for debug: ${String(raw).slice(0, 4000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    this.logger.log(`[board] parsed keys=${JSON.stringify(Object.keys(parsed ?? {}))}`)

    return this.postProcess(parsed)
  }

  private async loadReference() {
    const start = Date.now()
    this.logger.log(`[ref] loading reference ${this.REF_PATH}`)

    let buf: Buffer
    try {
      buf = await readFile(this.REF_PATH)
    } catch (e: any) {
      this.logger.error(`[ref] cannot read reference: ${e?.message ?? e}`)
      throw new InternalServerErrorException('Cannot read reference image on server')
    }

    const dt = Date.now() - start
    this.logger.log(`[ref] loaded bytes=${buf.length} dt=${dt}ms`)

    return buf
  }

  private postProcess(parsed: any) {
    const quadrants = parsed?.quadrants ?? {}

    const q: Record<Quadrant, QuadrantResult> = {
      haut_gauche: {
        same: Boolean(quadrants?.haut_gauche?.same),
        why: String(quadrants?.haut_gauche?.why ?? '')
      },
      haut_droite: {
        same: Boolean(quadrants?.haut_droite?.same),
        why: String(quadrants?.haut_droite?.why ?? '')
      },
      bas_gauche: {
        same: Boolean(quadrants?.bas_gauche?.same),
        why: String(quadrants?.bas_gauche?.why ?? '')
      },
      bas_droite: {
        same: Boolean(quadrants?.bas_droite?.same),
        why: String(quadrants?.bas_droite?.why ?? '')
      }
    }

    const global = q.haut_gauche.same && q.haut_droite.same && q.bas_gauche.same && q.bas_droite.same

    const response = {
      ok: true as const,
      global,
      quadrants: q
    }

    this.logger.log(`[board] global=${global}`)
    this.logger.log(`[board] quadrants=${JSON.stringify(q)}`)
    this.logger.log(`[board] response->front=${JSON.stringify(response)}`)

    return response
  }

  private buildPrompt() {
    return `
Tu compares 2 images du jeu So Clover.

Image 1 = référence correcte.
Image 2 = photo test.

Ignore les mots du fond vert. Concentre-toi uniquement sur les 4 cartes blanches.
Imagine que l'image est divisée en 4 quadrants, chacun contenant une carte blanche.

Pour CHAQUE quadrant :
- haut_gauche
- haut_droite
- bas_gauche
- bas_droite

Tu dois vérifier pour quache cadran strictement les 3 points :
1) Est-ce la même carte (mêmes 4 mots) ?
2) Est-elle dans le même sens (orientation identique) ?
3) Est-elle dans le même quadrant (emplacement identique) ?

Important :
Une carte est SAME uniquement si :
✔ même carte
✔ même orientation
✔ même quadrant

Si tu n’es pas sûr (flou, reflet, angle), mets same=false et explique pourquoi.

Réponds UNIQUEMENT en JSON strict :
{
  "quadrants": {
    "haut_gauche": { "same": boolean, "why": string },
    "haut_droite": { "same": boolean, "why": string },
    "bas_gauche": { "same": boolean, "why": string },
    "bas_droite": { "same": boolean, "why": string }
  }
}
`.trim()
  }

  private stripJson(text: string) {
    const t = String(text ?? '').trim()

    // Cas ```json ... ```
    if (t.startsWith('```')) {
      return t
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim()
    }

    // Cas "voici le JSON: {...}"
    const i = t.indexOf('{')
    const j = t.lastIndexOf('}')
    // eslint-disable-next-line no-magic-numbers
    if (i !== -1 && j !== -1 && j > i) return t.slice(i, j + 1)

    return t
  }
}
