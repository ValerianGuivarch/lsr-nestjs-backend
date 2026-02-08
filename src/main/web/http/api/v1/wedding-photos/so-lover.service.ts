import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { extname } from 'path'

type Quadrant = 'haut_gauche' | 'haut_droite' | 'bas_gauche' | 'bas_droite'
type Orientation = 'haut' | 'bas' | 'gauche' | 'droite'
type AnchorWord = 'bouche' | 'boisson' | 'diable' | 'espece'

const QUADRANTS: Quadrant[] = ['haut_gauche', 'haut_droite', 'bas_gauche', 'bas_droite']
const ORIENTATIONS: Orientation[] = ['haut', 'bas', 'gauche', 'droite']

// eslint-disable-next-line no-magic-numbers
type CardId = 1 | 2 | 3 | 4

const CARDS: Record<CardId, { anchor: AnchorWord; words: string[] }> = {
  1: { anchor: 'bouche', words: ['bouche', 'lame', 'paix', 'bassin'] },
  2: { anchor: 'boisson', words: ['court', 'boisson', 'cheval', 'polaire'] },
  3: { anchor: 'diable', words: ['couche', 'diable', 'menthe', 'recent'] },
  4: { anchor: 'espece', words: ['ete', 'espece', 'temple', 'costume'] }
}

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private readonly apiKey = process.env.OPENAI_API_KEY

  // ✅ Tu peux changer le modèle via env si tu veux (ex: gpt-4.1)
  // eslint-disable-next-line no-process-env
  private readonly model = process.env.SOL_OVER_MODEL || 'gpt-4.1'

  // ✅ Référence locale (évite à OpenAI de downloader)
  private readonly REFERENCE_LOCAL_PATH = '/volume1/homes/Valou/lsr-nestjs-backend/src/assets/so-lover/resultat.png'

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(testImage: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    // 1) load reference as data URL
    const refDataUrl = await this.loadReferenceAsDataUrl()
    const testDataUrl = `data:image/jpeg;base64,${testImage.toString('base64')}`

    // 2) prompt + schema
    const prompt = this.buildPrompt()

    const payload = {
      model: this.model,
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
            // Image 1: référence
            { type: 'input_image', image_url: refDataUrl },
            // Image 2: test
            { type: 'input_image', image_url: testDataUrl }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(
      `[board] OpenAI request model=${this.model} testBytes≈${testImage.length} ref=${this.REFERENCE_LOCAL_PATH}`
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

    const rawText =
      data.output_text ??
      data.output
        ?.flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n') ??
      ''

    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[board] rawText (truncated): ${String(rawText).slice(0, 1200)}`)

    let parsed: any
    try {
      parsed = JSON.parse(this.stripJson(rawText))
    } catch (e: any) {
      this.logger.error(`[board] JSON.parse failed: ${e?.message ?? e}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] Unparseable (truncated): ${String(rawText).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    return this.postProcess(parsed)
  }

  private postProcess(parsed: any) {
    const quadrants = parsed?.quadrants ?? {}
    const global = parsed?.global ?? null

    // logs global
    this.logger.log(`[board] global.same=${Boolean(global?.same)} global.why=${String(global?.why ?? '')}`)

    // On construit un résumé anch1..anch4
    const resultAnchors: Record<'anch1' | 'anch2' | 'anch3' | 'anch4', boolean> = {
      anch1: false,
      anch2: false,
      anch3: false,
      anch4: false
    }

    // détails debug (optionnel, tu peux le garder serveur-only)
    const details: any = {}

    for (const q of QUADRANTS) {
      const item = quadrants?.[q]
      const ref = item?.ref
      const test = item?.test

      const refCard: CardId | null = ref?.cardId ?? null
      const testCard: CardId | null = test?.cardId ?? null

      const refOri: Orientation | null = ref?.anchorOrientation ?? null
      const testOri: Orientation | null = test?.anchorOrientation ?? null

      const modelSame = Boolean(item?.same)
      const why = String(item?.why ?? '')

      // ✅ Recalcule “same” côté serveur (anti-hallu)
      const sameComputed = Boolean(
        refCard && testCard && refOri && testOri && refCard === testCard && refOri === testOri
      )

      // mapping anchX
      const anchKey = this.quadrantToAnchorKey(q)
      resultAnchors[anchKey] = sameComputed

      // logs
      this.logger.log(
        `[board:${q}] modelSame=${modelSame} computedSame=${sameComputed} ref={card=${refCard},ori=${refOri}} test={card=${testCard},ori=${testOri}}`
      )
      // why en log (tronqué)
      // eslint-disable-next-line no-magic-numbers
      this.logger.log(`[board:${q}] why: ${why.slice(0, 800)}`)

      // on log aussi si le modèle se contredit vs computed
      if (modelSame !== sameComputed) {
        this.logger.warn(
          `[board:${q}] mismatch modelSame(${modelSame}) != computedSame(${sameComputed}) — trusting computedSame`
        )
      }

      details[q] = {
        modelSame,
        computedSame: sameComputed,
        ref: { cardId: refCard, anchorOrientation: refOri },
        test: { cardId: testCard, anchorOrientation: testOri },
        why
      }
    }

    const allOk = Object.values(resultAnchors).every(Boolean)

    this.logger.log(`[board] summary anchors=${JSON.stringify(resultAnchors)} allOk=${allOk}`)

    // ✅ Réponse API: simple + stable pour le front
    return {
      ok: true,
      result: resultAnchors,
      // tu peux retirer details si tu veux alléger la réponse
      details
    }
  }

  // eslint-disable-next-line consistent-return
  private quadrantToAnchorKey(q: Quadrant): 'anch1' | 'anch2' | 'anch3' | 'anch4' {
    switch (q) {
      case 'haut_gauche':
        return 'anch1'
      case 'haut_droite':
        return 'anch2'
      case 'bas_gauche':
        return 'anch3'
      case 'bas_droite':
        return 'anch4'
    }
  }

  private buildPrompt() {
    const cardLines = (Object.keys(CARDS) as unknown as CardId[])
      .sort()
      .map((id) => {
        const c = CARDS[id]
        return `- carte ${id} (anchor="${c.anchor}") : ${c.words.join(', ')}`
      })
      .join('\n')

    return `
Tu compares DEUX photos du jeu So Clover.
- Image 1 = référence (bonne configuration)
- Image 2 = photo test

IMPORTANT (anti-erreur):
- Ignore les mots écrits sur le fond vert (lèvre, biberon, etc.). Ils ne servent qu'à t'orienter.
- Tu dois repérer les 4 CARTES BLANCHES (chacune a 4 mots imprimés).
- Pour chaque QUADRANT (haut_gauche / haut_droite / bas_gauche / bas_droite), tu dois:
  1) identifier QUELLE carte blanche occupe ce quadrant sur l'image 1,
  2) identifier QUELLE carte blanche occupe ce quadrant sur l'image 2,
  3) vérifier si c'est la même carte ET si elle est orientée pareil.
- Ne te contente pas de trouver “la carte existe quelque part” : il faut qu'elle soit dans le BON quadrant.

Définition des quadrants:
- haut_gauche = carte en haut à gauche du centre du trèfle
- haut_droite = carte en haut à droite
- bas_gauche = carte en bas à gauche
- bas_droite = carte en bas à droite

Cartes possibles (les 4 mots sont uniques pour reconnaître la carte) :
${cardLines}

Orientation demandée:
Pour la carte, on regarde le mot "anchor" (bouche / boisson / diable / espece).
Tu dois dire où se trouve ce mot anchor sur la carte (dans l'image): "haut" / "droite" / "bas" / "gauche".
Ex: si le mot anchor est imprimé sur le bord supérieur de la carte, orientation="haut".

Sortie attendue:
- Pour chaque quadrant: ref.cardId + ref.anchorOrientation, test.cardId + test.anchorOrientation, same, why.
- Si tu es incertain (flou, reflet, carte coupée): mets cardId=null ou anchorOrientation=null et same=false.
- "why" doit expliquer explicitement la comparaison (placement + orientation), pas juste “c’est pareil”.

Réponds uniquement en JSON strict conforme au schéma.
`.trim()
  }

  /**
   * ✅ Schema STRICT: additionalProperties:false partout
   * (sinon l’API renvoie exactement l’erreur que tu as eue)
   */
  private schema() {
    const orientationSchema = { type: 'string', enum: ORIENTATIONS } as const

    // eslint-disable-next-line no-magic-numbers
    const cardIdSchema = { anyOf: [{ type: 'integer', enum: [1, 2, 3, 4] }, { type: 'null' }] } as const

    const refTestSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['cardId', 'anchorOrientation'],
      properties: {
        cardId: cardIdSchema,
        anchorOrientation: { anyOf: [orientationSchema, { type: 'null' }] }
      }
    } as const

    const quadrantItemSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['ref', 'test', 'same', 'why'],
      properties: {
        ref: refTestSchema,
        test: refTestSchema,
        same: { type: 'boolean' },
        why: { type: 'string' }
      }
    } as const

    const quadrantsSchema: any = {
      type: 'object',
      additionalProperties: false,
      required: QUADRANTS,
      properties: {}
    }

    for (const q of QUADRANTS) {
      quadrantsSchema.properties[q] = quadrantItemSchema
    }

    return {
      type: 'object',
      additionalProperties: false,
      required: ['quadrants', 'global'],
      properties: {
        quadrants: quadrantsSchema,
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

  private async loadReferenceAsDataUrl(): Promise<string> {
    const start = Date.now()
    this.logger.log(`[ref] loading reference ${this.REFERENCE_LOCAL_PATH}`)

    let buf: Buffer
    try {
      buf = await readFile(this.REFERENCE_LOCAL_PATH)
    } catch (e: any) {
      this.logger.error(`[ref] cannot read reference file: ${e?.message ?? e}`)
      throw new InternalServerErrorException('Cannot read reference image on server')
    }

    const dt = Date.now() - start
    const ext = extname(this.REFERENCE_LOCAL_PATH).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream'

    this.logger.log(`[ref] loaded bytes=${buf.length} contentType=${contentType} dt=${dt}ms`)

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
