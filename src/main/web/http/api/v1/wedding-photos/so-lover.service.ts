import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'

type Side = 'haut' | 'droite' | 'bas' | 'gauche'
type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  private apiKey = process.env.OPENAI_API_KEY

  private REF_PATH = '/volume1/homes/Valou/lsr-nestjs-backend/src/assets/so-lover/resultat.png'

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
            {
              type: 'input_text',
              text: this.buildPrompt()
            },
            {
              type: 'input_image',
              image_url: `data:image/png;base64,${base64Ref}`
            },
            {
              type: 'input_image',
              image_url: `data:image/jpeg;base64,${base64Test}`
            }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`[board] OpenAI request model=gpt-4.1 testBytes≈${image.length} ref=${this.REF_PATH}`)

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
      this.logger.error(txt)
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

    this.logger.log(`[board] rawText FULL: ${raw}`)

    const parsed = JSON.parse(raw)

    return this.postProcess(parsed)
  }

  private async loadReference() {
    const start = Date.now()
    this.logger.log(`[ref] loading reference ${this.REF_PATH}`)

    const buf = await readFile(this.REF_PATH)

    const dt = Date.now() - start
    this.logger.log(`[ref] loaded bytes=${buf.length} dt=${dt}ms`)

    return buf
  }

  private postProcess(parsed: any) {
    const quadrants = parsed?.quadrants ?? {}

    const anchors = {
      anch1: quadrants.haut_gauche?.same ?? false,
      anch2: quadrants.haut_droite?.same ?? false,
      anch3: quadrants.bas_gauche?.same ?? false,
      anch4: quadrants.bas_droite?.same ?? false
    }

    // ⭐ Mapping vers le front (SIDES)
    const result: Record<Side, boolean> = {
      haut: anchors.anch1 && anchors.anch2,
      bas: anchors.anch3 && anchors.anch4,
      gauche: anchors.anch1 && anchors.anch3,
      droite: anchors.anch2 && anchors.anch4
    }

    this.logger.log(`[board] anchors=${JSON.stringify(anchors)}`)
    this.logger.log(`[board] resultBySide=${JSON.stringify(result)}`)

    return {
      ok: true,
      result
    }
  }

  private buildPrompt() {
    return `
Tu compares 2 images du jeu So Clover.

Image 1 = référence correcte.
Image 2 = photo test.

Il y a 4 cartes blanches.

Pour CHAQUE quadrant :
- haut_gauche
- haut_droite
- bas_gauche
- bas_droite

Tu dois vérifier :
1️⃣ Est-ce la même carte ?
2️⃣ Est-elle dans le même sens ?
3️⃣ Est-elle au même endroit ?

Important :
Une carte est SAME uniquement si :
✔ même carte
✔ même orientation
✔ même quadrant

Sinon → false

Réponds en JSON :
{
  "quadrants": {
    "haut_gauche": { "same": boolean, "why": string },
    "haut_droite": { "same": boolean, "why": string },
    "bas_gauche": { "same": boolean, "why": string },
    "bas_droite": { "same": boolean, "why": string }
  }
}
`
  }
}
