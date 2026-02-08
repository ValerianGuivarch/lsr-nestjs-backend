import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

type Pos = 'hg' | 'hd' | 'bg' | 'bd'
type Side = 'haut' | 'droite' | 'bas' | 'gauche'

const WORD_ENUM = ['court', 'boisson', 'couche', 'diable', 'ete', 'espece', 'bouche', 'bassin'] as const
type Word = (typeof WORD_ENUM)[number]

const POS_ENUM = ['hg', 'hd', 'bg', 'bd'] as const

type TileRead = {
  words: [Word, Word, Word, Word] | null // N,E,S,O (sens horaire) OU null si illisible
  why: string
}

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)
  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  /**
   * Règles attendues : pour chaque position (HG/HD/BG/BD),
   * quels mots doivent toucher les 2 mots fixes adjacents.
   *
   * Repère FIXE imposé dans le prompt :
   * - LEVRE = haut du plateau
   * - BIBERON = droite
   * - SUCCUBE = bas
   * - CRAPAUD = gauche
   *
   * Donc :
   * - HG touche LEVRE & CRAPAUD
   * - HD touche LEVRE & BIBERON
   * - BD touche SUCCUBE & BIBERON
   * - BG touche SUCCUBE & CRAPAUD
   */
  private EXPECTED_BY_POS: Record<
    Pos,
    {
      // pour comparer ensuite, on stocke ce qu’on attend côté fixe
      touches: Partial<Record<'levre' | 'biberon' | 'succube' | 'crapaud', Word>>
    }
  > = {
    hg: { touches: { levre: 'bouche', crapaud: 'bassin' } },
    hd: { touches: { levre: 'court', biberon: 'boisson' } },
    bd: { touches: { succube: 'diable', biberon: 'couche' } },
    bg: { touches: { succube: 'ete', crapaud: 'espece' } }
  }

  // Pour garder ton retour actuel (haut/droite/bas/gauche) côté front :
  private POS_TO_SIDE: Record<Pos, Side> = {
    hg: 'gauche', // HG = côté gauche du trèfle (diagonale haut-gauche)
    hd: 'haut', // HD = côté haut
    bd: 'droite', // BD = côté droite
    bg: 'bas' // BG = côté bas
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const dataUrl = `data:image/jpeg;base64,${image.toString('base64')}`

    // 1) Lire le plateau entier : positions HG/HD/BG/BD + orientation des mots
    const board = await this.readBoardWhole(dataUrl)

    // 2) Comparer localement (stable) selon tes règles
    const { resultByPos, detailsByPos } = this.compareBoard(board)

    // 3) Adapter au format frontend actuel: haut/droite/bas/gauche (pas obligé mais pratique)
    const resultBySide: Record<Side, boolean> = {
      haut: resultByPos.hd,
      droite: resultByPos.bd,
      bas: resultByPos.bg,
      gauche: resultByPos.hg
    }

    // logs utiles
    this.logger.log(`Board read: ${JSON.stringify(board)}`)
    this.logger.log(`Result by pos: ${JSON.stringify(resultByPos)}`)
    this.logger.log(`Result by side: ${JSON.stringify(resultBySide)}`)
    this.logger.log(`Details by pos: ${JSON.stringify(detailsByPos)}`)

    // On ne renvoie pas les "why" si tu veux rester clean.
    // Mais je te laisse "board" et "details" pour debug: tu peux les retirer plus tard.
    return {
      ok: true,
      result: {
        haut: resultBySide.haut,
        droite: resultBySide.droite,
        bas: resultBySide.bas,
        gauche: resultBySide.gauche
      },
      board, // debug
      details: detailsByPos // debug
    }
  }

  /**
   * Lecture plateau entier, sans crop.
   * On demande :
   * - où sont les 4 cartes (HG/HD/BG/BD)
   * - pour chaque carte : les 4 mots imprimés dans l'ordre N/E/S/O (horaire)
   * - + why pour logs
   */
  private async readBoardWhole(imageDataUrl: string): Promise<Record<Pos, TileRead>> {
    const prompt = `
Tu es un validateur du jeu So Clover.

IMPORTANT (repère de l'image):
- Le mot fixe "LEVRE" indique le HAUT du plateau.
- "BIBERON" = droite du plateau
- "SUCCUBE" = bas du plateau
- "CRAPAUD" = gauche du plateau

Au centre il y a 4 cartes roses en grille 2×2:
- hg = en haut-gauche
- hd = en haut-droite
- bg = en bas-gauche
- bd = en bas-droite

TÂCHE:
Pour chacune des 4 cartes (hg/hd/bg/bd),
lis UNIQUEMENT les mots imprimés sur la carte rose et renvoie les 4 mots
dans l'ordre suivant: N, E, S, O (sens horaire, avec N = côté "haut" de la PHOTO).

Contraintes:
- Tu n'as le droit de répondre que par un mot parmi: ${WORD_ENUM.join(', ')}
- Si un mot est illisible: renvoie null (et explique dans "why")
- Ne devine pas.

En plus, pour chaque carte, remplis "why" en 1-2 phrases (orientation, lisibilité, etc.).
Réponds UNIQUEMENT en JSON strict.
`.trim()

    const schema = {
      type: 'object',
      additionalProperties: false,
      required: [...POS_ENUM],
      properties: Object.fromEntries(
        POS_ENUM.map((p) => [
          p,
          {
            type: 'object',
            additionalProperties: false,
            required: ['words', 'why'],
            properties: {
              // [N,E,S,O] chacun = enum ou null ; si trop dur, tout words=null
              words: {
                anyOf: [
                  { type: 'null' },
                  {
                    type: 'array',
                    minItems: 4,
                    maxItems: 4,
                    items: { anyOf: [{ type: 'string', enum: [...WORD_ENUM] }, { type: 'null' }] }
                  }
                ]
              },
              why: { type: 'string' }
            }
          }
        ])
      )
    }

    const payload = {
      model: 'gpt-4.1-mini',
      temperature: 0,
      text: {
        format: {
          type: 'json_schema',
          name: 'so_clover_board_whole',
          strict: true,
          schema
        }
      },
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: imageDataUrl }
          ]
        }
      ]
    }

    const start = Date.now()
    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[board] OpenAI request bytes≈${Math.round((imageDataUrl.length * 3) / 4)}`)

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
      this.logger.error(`[board] OpenAI error (truncated): ${(txt || '').slice(0, 2000)}`)
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

    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[board] rawText (truncated): ${String(rawText).slice(0, 1200)}`)

    const parsed = JSON.parse(this.stripJson(rawText))

    // log why
    for (const pos of POS_ENUM) {
      // eslint-disable-next-line no-magic-numbers
      this.logger.log(`[board:${pos}] why: ${String(parsed?.[pos]?.why ?? '').slice(0, 800)}`)
    }

    return parsed as Record<Pos, TileRead>
  }

  /**
   * Compare en local.
   * On déduit quels mots touchent LEVRE/BIBERON/SUCCUBE/CRAPAUD en fonction de la position.
   *
   * Convention simple (très stable) :
   * - Carte HG touche LEVRE (au nord de la carte) et CRAPAUD (à l’ouest de la carte)
   * - Carte HD touche LEVRE (nord) et BIBERON (est)
   * - Carte BD touche SUCCUBE (sud) et BIBERON (est)
   * - Carte BG touche SUCCUBE (sud) et CRAPAUD (ouest)
   *
   * Donc on prend words[N], words[E], words[S], words[O] selon le cas.
   */
  private compareBoard(board: Record<Pos, TileRead>) {
    const resultByPos: Record<Pos, boolean> = { hg: false, hd: false, bg: false, bd: false }
    const detailsByPos: Record<
      Pos,
      {
        ok: boolean
        touches: Record<string, { expected: Word; got: Word | null; ok: boolean }>
        why: string
        words: [Word | null, Word | null, Word | null, Word | null] | null
      }
    > = {
      hg: { ok: false, touches: {}, why: '', words: null },
      hd: { ok: false, touches: {}, why: '', words: null },
      bg: { ok: false, touches: {}, why: '', words: null },
      bd: { ok: false, touches: {}, why: '', words: null }
    }

    for (const pos of POS_ENUM) {
      const tile = board[pos]
      const words = tile?.words ?? null
      const why = String(tile?.why ?? '')

      detailsByPos[pos].why = why
      detailsByPos[pos].words = words as any

      // eslint-disable-next-line no-magic-numbers
      if (!words || words.length !== 4) {
        // illisible => false
        resultByPos[pos] = false
        detailsByPos[pos].ok = false
        continue
      }

      // N,E,S,O
      const N = this.normWord(words[0])
      const E = this.normWord(words[1])
      // eslint-disable-next-line no-magic-numbers
      const S = this.normWord(words[2])
      // eslint-disable-next-line no-magic-numbers
      const O = this.normWord(words[3])

      const expectedTouches = this.EXPECTED_BY_POS[pos].touches

      const touches: any = {}

      // mapping touches attendu selon pos
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pick = (which: 'n' | 'e' | 's' | 'o'): Word | null => {
        if (which === 'n') return N
        if (which === 'e') return E
        if (which === 's') return S
        return O
      }

      // hg: levre<-N, crapaud<-O
      // hd: levre<-N, biberon<-E
      // bd: succube<-S, biberon<-E
      // bg: succube<-S, crapaud<-O
      const actualByFixed: Record<string, Word | null> =
        pos === 'hg'
          ? { levre: N, crapaud: O }
          : pos === 'hd'
          ? { levre: N, biberon: E }
          : pos === 'bd'
          ? { succube: S, biberon: E }
          : { succube: S, crapaud: O }

      let okAll = true
      for (const [fixed, exp] of Object.entries(expectedTouches)) {
        const got = (actualByFixed as any)[fixed] ?? null
        const ok = got === exp
        touches[fixed] = { expected: exp, got, ok }
        if (!ok) okAll = false

        this.logger.log(
          `[compare:${pos}] fixed=${fixed} expected=${exp} got=${got ?? null} ok=${ok} (N=${N},E=${E},S=${S},O=${O})`
        )
      }

      resultByPos[pos] = okAll
      detailsByPos[pos].ok = okAll
      detailsByPos[pos].touches = touches
    }

    return { resultByPos, detailsByPos }
  }

  private normWord(w: any): Word | null {
    if (w == null) return null
    const s = String(w)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '')

    // match strict enum
    return (WORD_ENUM as readonly string[]).includes(s) ? (s as Word) : null
  }

  private stripJson(text: string) {
    const t = String(text ?? '').trim()
    if (t.startsWith('```'))
      return t
        .replace(/^```[a-z]*\n/, '')
        .replace(/\n```$/, '')
        .trim()
    const i = t.indexOf('{')
    const j = t.lastIndexOf('}')
    // eslint-disable-next-line no-magic-numbers
    if (i !== -1 && j !== -1) return t.slice(i, j + 1)
    return t
  }
}
