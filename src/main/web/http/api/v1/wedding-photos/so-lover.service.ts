import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'
const QUADRANTS: Quadrant[] = ['haut_gauche', 'haut_droite', 'bas_gauche', 'bas_droite']

type QuadrantResult = {
  same: boolean
  why: string
}

type ModelOutput = {
  quadrants: Record<Quadrant, QuadrantResult>
  global: { same: boolean; why: string }
}

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  /**
   * ✅ Tu changes le modèle ICI (côté code uniquement).
   * - gpt-4.1-mini : moins cher, moins fiable
   * - gpt-4.1      : mieux
   * - (si dispo sur ton compte) un modèle vision plus haut de gamme : encore mieux
   */
  private readonly MODEL = 'gpt-4.1' as const

  /**
   * Image de référence (plateau correct) stockée côté serveur.
   * (le modèle OpenAI ne télécharge rien chez toi: on envoie du base64)
   */
  private readonly REFERENCE_LOCAL_PATH = '/volume1/homes/Valou/lsr-nestjs-backend/src/assets/so-lover/resultat.png'

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    // 1) Charge la référence en data URL
    const refDataUrl = await this.loadReferenceAsDataUrl()

    // 2) Convertit la photo test en data URL
    const testDataUrl = `data:image/jpeg;base64,${image.toString('base64')}`

    // 3) Prompt + schema (structured output)
    const prompt = this.buildPrompt()

    const payload = {
      model: this.MODEL,
      temperature: 0,
      text: {
        format: {
          type: 'json_schema',
          name: 'so_clover_compare_quadrants',
          strict: true,
          schema: this.schema()
        }
      },
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },

            // Image 1: référence (plateau correct)
            { type: 'input_image', image_url: refDataUrl },

            // Image 2: photo à valider
            { type: 'input_image', image_url: testDataUrl }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(
      `[board] OpenAI request model=${this.MODEL} testBytes≈${image.length} ref=${this.REFERENCE_LOCAL_PATH}`
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
      this.logger.error(`[board] OpenAI error body (truncated): ${(txt || '').slice(0, 2000)}`)
      throw new InternalServerErrorException('OpenAI error')
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
    this.logger.log(`[board] rawText (truncated): ${String(rawText).slice(0, 900)}`)

    const parsed = this.safeParse<ModelOutput>(rawText)

    // 4) Log détaillé WHY (mais on ne renvoie pas why au front si tu veux)
    this.logSummary(parsed)

    // 5) Retour API: bool par quadrant (front peut s’adapter ensuite)
    const result: Record<Quadrant, boolean> = {
      haut_gauche: !!parsed.quadrants.haut_gauche.same,
      haut_droite: !!parsed.quadrants.haut_droite.same,
      bas_gauche: !!parsed.quadrants.bas_gauche.same,
      bas_droite: !!parsed.quadrants.bas_droite.same
    }

    // Optionnel: garder la compat “haut/droite/bas/gauche” si tu veux brancher le front actuel
    // Ici je te mets un mapping simple “tout ok” si tous les quadrants sont ok.
    // (Tu adapteras ensuite la sémantique si nécessaire.)
    const allOk = Object.values(result).every(Boolean)

    return {
      ok: true,
      result, // ✅ bool par quadrant (nouveau)
      allOk // ✅ pratique
      // NOTE: on NE renvoie PAS why au front
    }
  }

  // ----------------------------
  // Prompt + schema
  // ----------------------------

  private buildPrompt() {
    return `
Tu es un validateur d'images pour le jeu So Clover.

Tu reçois 2 images :
- Image 1 = référence (plateau correct)
- Image 2 = photo à valider

But :
Comparer UNIQUEMENT les 4 cartes roses (les cartes avec 4 mots imprimés) entre les deux images.

IMPORTANT :
- Ignore totalement tout ce qui est écrit sur le fond vert (mots manuscrits, traits, etc.).
- Ignore la table, les mains, l’ombre, les reflets.
- Concentre-toi sur les 4 cartes roses et leur ORIENTATION.
- Une carte est "pareille" si c'est la même carte (mêmes 4 mots) ET dans le même sens (orientation identique).

On découpe le plateau en 4 zones / quadrants :
- haut_gauche
- haut_droite
- bas_gauche
- bas_droite

Pour chaque quadrant :
- same = true si la carte rose du quadrant de l'image 2 est identique ET orientée pareil que sur l'image 1
- same = false sinon (carte différente, rotation différente, carte absente, incertain)

Ajoute un champ "why" (1 phrase courte) pour expliquer ta décision dans ce quadrant.
Si tu es incertain (flou, angle, carte partiellement cachée), mets same=false et explique dans why.

Réponds uniquement en JSON au format imposé.
`.trim()
  }

  /**
   * ⚠️ Important: OpenAI te demande additionalProperties:false à tous les niveaux.
   */
  private schema() {
    const quadrantSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['same', 'why'],
      properties: {
        same: { type: 'boolean' },
        why: { type: 'string' }
      }
    }

    return {
      type: 'object',
      additionalProperties: false,
      required: ['quadrants', 'global'],
      properties: {
        quadrants: {
          type: 'object',
          additionalProperties: false,
          required: QUADRANTS,
          properties: {
            haut_gauche: quadrantSchema,
            haut_droite: quadrantSchema,
            bas_gauche: quadrantSchema,
            bas_droite: quadrantSchema
          }
        },
        global: {
          type: 'object',
          additionalProperties: false,
          required: ['same', 'why'],
          properties: {
            same: { type: 'boolean' },
            why: { type: 'string' }
          }
        }
      }
    }
  }

  // ----------------------------
  // Logs & helpers
  // ----------------------------

  private logSummary(parsed: ModelOutput) {
    // Log global
    this.logger.log(`[board] global.same=${parsed.global?.same} global.why=${this.trunc(parsed.global?.why, 300)}`)

    // Logs quadrant par quadrant
    for (const q of QUADRANTS) {
      const it = parsed.quadrants?.[q]
      this.logger.log(`[board:${q}] same=${it?.same} why=${this.trunc(it?.why, 500)}`)
    }

    // Résumé bool
    const summary: Record<Quadrant, boolean> = {
      haut_gauche: !!parsed.quadrants.haut_gauche.same,
      haut_droite: !!parsed.quadrants.haut_droite.same,
      bas_gauche: !!parsed.quadrants.bas_gauche.same,
      bas_droite: !!parsed.quadrants.bas_droite.same
    }
    this.logger.log(`[board] summary=${JSON.stringify(summary)}`)
  }

  private trunc(s: any, n: number) {
    const t = String(s ?? '')
    return t.length > n ? `${t.slice(0, n)}…` : t
  }

  private safeParse<T>(text: string): T {
    const t = this.stripJson(text)
    try {
      return JSON.parse(t) as T
    } catch (e: any) {
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] JSON.parse failed: ${(e?.message ?? e) as string} body=${t.slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
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

  private async loadReferenceAsDataUrl(): Promise<string> {
    const start = Date.now()
    this.logger.log(`[ref] loading reference ${this.REFERENCE_LOCAL_PATH}`)

    let buf: Buffer
    try {
      buf = await readFile(this.REFERENCE_LOCAL_PATH)
    } catch (e: any) {
      this.logger.error(`[ref] cannot read: ${e?.message ?? e}`)
      throw new InternalServerErrorException('Cannot read reference image on server')
    }

    const dt = Date.now() - start
    const ext = extname(this.REFERENCE_LOCAL_PATH).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream'

    this.logger.log(`[ref] loaded bytes=${buf.length} contentType=${contentType} dt=${dt}ms`)

    return `data:${contentType};base64,${buf.toString('base64')}`
  }
}
