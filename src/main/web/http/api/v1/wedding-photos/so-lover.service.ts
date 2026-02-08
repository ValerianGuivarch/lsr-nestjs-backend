import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'

type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'
type AnchorId = 'anch1' | 'anch2' | 'anch3' | 'anch4'

type ModelQuadrant = {
  same: boolean
  why?: string
}

type ModelResponse = {
  quadrants: Record<Quadrant, ModelQuadrant>
}

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  private readonly MODEL = 'gpt-4.1-mini' // tu peux switcher ici (ex: 'gpt-4.1')
  private readonly REF_PATH = '/volume1/homes/Valou/lsr-nestjs-backend/src/assets/so-lover/resultat.png'

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const refBuffer = await this.loadReference()

    const base64Test = image.toString('base64')
    const base64Ref = refBuffer.toString('base64')

    const prompt = this.buildPrompt()

    const payload = {
      model: this.MODEL,
      temperature: 0,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: `data:image/png;base64,${base64Ref}` }, // ref
            { type: 'input_image', image_url: `data:image/jpeg;base64,${base64Test}` } // test
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`[board] OpenAI request model=${this.MODEL} testBytes≈${image.length} ref=${this.REF_PATH}`)

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

    const raw =
      data.output_text ??
      data.output
        ?.flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n') ??
      ''

    // log full (comme tu voulais)
    this.logger.log(`[board] rawText FULL: ${raw}`)

    let parsed: ModelResponse
    try {
      parsed = JSON.parse(raw)
    } catch (e: any) {
      this.logger.error(`[board] JSON.parse failed: ${(e?.message ?? e) as string}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] Unparseable raw (truncated): ${String(raw).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    return this.postProcess(parsed)
  }

  private async loadReference() {
    const start = Date.now()
    this.logger.log(`[ref] loading reference ${this.REF_PATH}`)

    let buf: Buffer
    try {
      buf = await readFile(this.REF_PATH)
    } catch (e: any) {
      this.logger.error(`[ref] readFile failed: ${(e?.message ?? e) as string}`)
      throw new InternalServerErrorException('Cannot read reference image')
    }

    const dt = Date.now() - start
    this.logger.log(`[ref] loaded bytes=${buf.length} dt=${dt}ms`)

    return buf
  }

  private postProcess(parsed: ModelResponse) {
    const quadrants = (parsed?.quadrants ?? {}) as Partial<Record<Quadrant, ModelQuadrant>>

    const anchors: Record<AnchorId, boolean> = {
      anch1: Boolean(quadrants.haut_gauche?.same),
      anch2: Boolean(quadrants.haut_droite?.same),
      anch3: Boolean(quadrants.bas_gauche?.same),
      anch4: Boolean(quadrants.bas_droite?.same)
    }

    const why: Record<AnchorId, string> = {
      anch1: String(quadrants.haut_gauche?.why ?? ''),
      anch2: String(quadrants.haut_droite?.why ?? ''),
      anch3: String(quadrants.bas_gauche?.why ?? ''),
      anch4: String(quadrants.bas_droite?.why ?? '')
    }

    const global = anchors.anch1 && anchors.anch2 && anchors.anch3 && anchors.anch4

    // logs explicites (ce que tu veux pouvoir vérifier)
    this.logger.log(`[board] computed anchors=${JSON.stringify(anchors)} global=${global}`)
    this.logger.log(`[board] why.anch1(HG)=${why.anch1 || '(empty)'}`)
    this.logger.log(`[board] why.anch2(HD)=${why.anch2 || '(empty)'}`)
    this.logger.log(`[board] why.anch3(BG)=${why.anch3 || '(empty)'}`)
    this.logger.log(`[board] why.anch4(BD)=${why.anch4 || '(empty)'}`)

    // ✅ Réponse API pour le nouveau front
    // (on ne renvoie pas les "why" au besoin; si tu veux les garder en option, laisse details)
    return {
      ok: true,
      anchors,
      global,
      // utile pour debug (tu peux le retirer quand c'est stable)
      details: {
        why,
        quadrants
      }
    }
  }

  private buildPrompt() {
    return `
Tu compares 2 images du jeu So Clover.

- Image 1 = référence correcte
- Image 2 = photo test

Ignore complètement les mots sur le fond vert (mots fixes).
Concentre-toi UNIQUEMENT sur les 4 cartes blanches (cartes mobiles).

Découpe mentalement l'image en 4 QUADRANTS :
- haut_gauche
- haut_droite
- bas_gauche
- bas_droite

Pour CHAQUE quadrant, tu dois :
1) Identifier la carte blanche présente dans ce quadrant (ses 4 mots, sans inventer)
2) Vérifier si, entre l'image 1 et l'image 2, c'est :
   - la MÊME carte (mêmes 4 mots)
   - dans le MÊME quadrant
   - avec la MÊME orientation (rotation)

Règle stricte :
same = true UNIQUEMENT si les 3 conditions sont vraies.
Sinon same = false.

Le champ "why" doit expliquer brièvement la décision (carte/position/orientation).

Réponds uniquement en JSON strict :
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
}
