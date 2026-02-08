import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

type Side = 'haut' | 'droite' | 'bas' | 'gauche'
type FixedWord = 'levre' | 'biberon' | 'succube' | 'crapaud'
type AnchorWord = 'bouche' | 'boisson' | 'diable' | 'espece'
type AnchorId = 'anch1' | 'anch2' | 'anch3' | 'anch4'

const SIDES: Side[] = ['haut', 'droite', 'bas', 'gauche']
const FIXED_WORDS: FixedWord[] = ['levre', 'biberon', 'succube', 'crapaud']
const ANCHOR_WORDS: AnchorWord[] = ['bouche', 'boisson', 'diable', 'espece']

// Règles du plateau "solution" (logique So Clover)
// Couples de mots fixes attendus par position:
const EXPECTED_PAIR_BY_SIDE: Record<Side, [FixedWord, FixedWord]> = {
  haut: ['levre', 'biberon'],
  droite: ['biberon', 'succube'],
  bas: ['succube', 'crapaud'],
  gauche: ['levre', 'crapaud']
}

// Le mot fixe que doit toucher le mot ancre de chaque carte mobile
const EXPECTED_ANCHOR_TOUCHES: Record<AnchorWord, FixedWord> = {
  bouche: 'levre',
  boisson: 'biberon',
  diable: 'succube',
  espece: 'crapaud'
}

// La position attendue de chaque mot ancre (déduite du couple de fixes)
const EXPECTED_ANCHOR_SIDE: Record<AnchorWord, Side> = {
  // carte (levre + crapaud)
  bouche: 'gauche',
  // carte (levre + biberon)
  boisson: 'haut',
  // carte (biberon + succube)
  diable: 'droite',
  // carte (succube + crapaud)
  espece: 'bas'
}

type ModelBoard = {
  fixed: Record<FixedWord, Side>
  mobiles: Record<
    AnchorId,
    {
      anchor: AnchorWord
      position: Side
      // orientation du mot anchor sur la carte (où est écrit le mot sur la carte)
      anchorOrientation: Side
      // les 2 mots fixes que la carte touche (les 2 pétales adjacents)
      touches: [FixedWord, FixedWord]
      // le mot fixe qui touche DIRECTEMENT le mot anchor (ex: "boisson" touche "biberon")
      anchorTouches: FixedWord
      // explication courte, log-only
      why: string
    }
  >
}

@Injectable()
export class SoLoverService {
  private readonly logger = new Logger(SoLoverService.name)

  // eslint-disable-next-line no-process-env
  private apiKey = process.env.OPENAI_API_KEY

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkBoard(image: Buffer) {
    if (!this.apiKey) throw new InternalServerErrorException('OPENAI_API_KEY missing')

    const dataUrl = `data:image/jpeg;base64,${image.toString('base64')}`

    const prompt = this.buildPrompt()

    const payload: any = {
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: dataUrl }
          ]
        }
      ]
    }

    const start = Date.now()
    this.logger.log(`[board] OpenAI request bytes≈${image.length}`)

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
      // eslint-disable-next-line no-magic-numbers
      throw new InternalServerErrorException((txt || '').slice(0, 2000))
    }

    const data: any = await r.json()

    const rawText: string =
      data.output_text ??
      data.output
        ?.flatMap((o: any) => o.content || [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n') ??
      ''

    // eslint-disable-next-line no-magic-numbers
    this.logger.log(`[board] rawText (truncated): ${String(rawText).slice(0, 2000)}`)

    const jsonText = this.stripJson(rawText)
    let parsed: ModelBoard
    try {
      parsed = JSON.parse(jsonText) as ModelBoard
    } catch (e: any) {
      this.logger.error(`[board] JSON.parse failed: ${(e?.message ?? e) as string}`)
      // eslint-disable-next-line no-magic-numbers
      this.logger.error(`[board] Unparseable JSON (truncated): ${String(jsonText).slice(0, 2000)}`)
      throw new InternalServerErrorException('Model returned invalid JSON')
    }

    // 1) sanity checks + normalisation légère
    const normalized = this.normalizeModelBoard(parsed)

    // 2) logs "why" (log-only)
    for (const anch of Object.keys(normalized.mobiles) as AnchorId[]) {
      // eslint-disable-next-line no-magic-numbers
      this.logger.log(`[board:${anch}] why: ${String(normalized.mobiles[anch]?.why ?? '').slice(0, 800)}`)
    }

    // 3) traitement local : est-ce que chaque anchX est bien placé ?
    const byAnchor = this.validateAnchors(normalized)

    // 4) petit récap log
    this.logger.log(`[board] Fixed positions: ${JSON.stringify(normalized.fixed)}`)
    this.logger.log(
      `[board] Mobiles: ${JSON.stringify(
        Object.fromEntries(
          (Object.keys(normalized.mobiles) as AnchorId[]).map((k) => [
            k,
            {
              anchor: normalized.mobiles[k].anchor,
              position: normalized.mobiles[k].position,
              anchorOrientation: normalized.mobiles[k].anchorOrientation,
              touches: normalized.mobiles[k].touches,
              anchorTouches: normalized.mobiles[k].anchorTouches
            }
          ])
        )
      )}`
    )
    this.logger.log(`[board] Result by anchor: ${JSON.stringify(byAnchor)}`)

    // 5) réponse API (front-friendly, sans les "why")
    // On renvoie aussi "detected" pour debug éventuel (tu peux enlever plus tard)
    return {
      ok: true,
      result: byAnchor,
      detected: {
        fixed: normalized.fixed,
        mobiles: Object.fromEntries(
          (Object.keys(normalized.mobiles) as AnchorId[]).map((k) => [
            k,
            {
              anchor: normalized.mobiles[k].anchor,
              position: normalized.mobiles[k].position,
              anchorOrientation: normalized.mobiles[k].anchorOrientation,
              touches: normalized.mobiles[k].touches,
              anchorTouches: normalized.mobiles[k].anchorTouches
            }
          ])
        )
      }
    }
  }

  private buildPrompt() {
    // NOTE: On impose une grammaire très stricte, et on rappelle : si doute => mettre "haut" etc quand même ? NON:
    // -> si doute: choisir "gauche/droite/haut/bas" au mieux, mais l'erreur est possible.
    // -> pour la robustesse, on force "why" qui explique.
    return `
Tu es un détecteur pour un plateau du jeu So Clover, photographié.

Tu dois analyser L'IMAGE ENTIÈRE.

Mots FIXES (manuscrits) présents EXACTEMENT une fois chacun :
- levre
- biberon
- succube
- crapaud

Cartes MOBILES : il y en a 4 et chacune contient un "mot ancre" unique (imprimé) :
- bouche
- boisson
- diable
- espece

TÂCHE 1 (FIXES):
Pour chaque mot fixe (levre, biberon, succube, crapaud), donne sa position relative à la photo :
"haut" | "droite" | "bas" | "gauche".
Tu DOIS utiliser ces 4 positions, et les 4 mots fixes doivent être tous présents.

TÂCHE 2 (MOBILES):
Tu dois retourner 4 objets "anch1..anch4" (ordre libre).
Pour chaque ancre, tu dois déterminer :
- anchor: l'un de [bouche, boisson, diable, espece] (chacun exactement une fois)
- position: où est située cette carte mobile dans la photo ("haut"|"droite"|"bas"|"gauche")
- anchorOrientation: où est écrit le mot anchor SUR LA CARTE (haut|droite|bas|gauche sur la carte elle-même)
- touches: les DEUX mots fixes (parmi levre,biberon,succube,crapaud) dont cette carte est adjacente (exactement 2 valeurs)
- anchorTouches: le mot fixe qui touche DIRECTEMENT le mot anchor (ex: boisson touche biberon)
- why: 1-2 phrases courtes expliquant comment tu as décidé (lisibilité, orientation, etc.)

IMPORTANT:
- Réponds UNIQUEMENT en JSON strict.
- Pas de markdown.
- Pas de texte autour.
- Utilise seulement ces strings exactes:
  - positions: haut|droite|bas|gauche
  - fixed: levre|biberon|succube|crapaud
  - anchors: bouche|boisson|diable|espece

FORMAT JSON EXACT:

{
  "fixed": {
    "levre": "haut|droite|bas|gauche",
    "biberon": "haut|droite|bas|gauche",
    "succube": "haut|droite|bas|gauche",
    "crapaud": "haut|droite|bas|gauche"
  },
  "mobiles": {
    "anch1": {
      "anchor": "bouche|boisson|diable|espece",
      "position": "haut|droite|bas|gauche",
      "anchorOrientation": "haut|droite|bas|gauche",
      "touches": ["levre|biberon|succube|crapaud", "levre|biberon|succube|crapaud"],
      "anchorTouches": "levre|biberon|succube|crapaud",
      "why": "..."
    },
    "anch2": { ... },
    "anch3": { ... },
    "anch4": { ... }
  }
}
`.trim()
  }

  private normalizeModelBoard(b: ModelBoard): ModelBoard {
    const fixed: any = {}
    for (const k of FIXED_WORDS) fixed[k] = this.normSide((b as any)?.fixed?.[k])

    const mobiles: any = {}
    const anchorsSeen = new Set<string>()
    for (const id of ['anch1', 'anch2', 'anch3', 'anch4'] as AnchorId[]) {
      const m = (b as any)?.mobiles?.[id] ?? {}
      const anchor = this.normAnchor(m.anchor)
      mobiles[id] = {
        anchor,
        position: this.normSide(m.position),
        anchorOrientation: this.normSide(m.anchorOrientation),
        touches: this.normTouches(m.touches),
        anchorTouches: this.normFixed(m.anchorTouches),
        why: String(m.why ?? '')
      }
      anchorsSeen.add(anchor)
    }

    // Logs si ça semble bizarre (mais on ne bloque pas ici, on bloque dans validate)
    this.logger.log(
      `[board] normalize anchorsSeen=${JSON.stringify(Array.from(anchorsSeen))} fixed=${JSON.stringify(fixed)}`
    )

    return { fixed, mobiles } as ModelBoard
  }

  private validateAnchors(b: ModelBoard) {
    // résultat demandé: "si chaque MOBILE_ANCHORS est bien placé ou pas"
    // on renvoie anch1..anch4 => { ok: boolean, details: ... }
    const out: Record<
      AnchorId,
      {
        ok: boolean
        details: {
          anchor: AnchorWord | string
          expected: {
            side: Side
            touchesPair: [FixedWord, FixedWord]
            anchorTouches: FixedWord
          }
          got: {
            position: Side
            touches: [FixedWord, FixedWord]
            anchorTouches: FixedWord
            anchorOrientation: Side
          }
          checks: {
            anchorUnique: boolean
            positionMatchesExpectedSide: boolean
            touchesPairMatches: boolean
            anchorTouchesMatches: boolean
          }
        }
      }
    > = {} as any

    // check unicité anchors
    const allAnchors = (Object.keys(b.mobiles) as AnchorId[]).map((k) => b.mobiles[k].anchor)
    // eslint-disable-next-line no-magic-numbers
    const uniqueOk = new Set(allAnchors).size === 4 && allAnchors.every((a) => ANCHOR_WORDS.includes(a as any))

    for (const id of Object.keys(b.mobiles) as AnchorId[]) {
      const m = b.mobiles[id]
      const anchor = m.anchor as AnchorWord

      const expectedSide = EXPECTED_ANCHOR_SIDE[anchor]
      const expectedPair = EXPECTED_PAIR_BY_SIDE[expectedSide]
      const expectedAnchorTouches = EXPECTED_ANCHOR_TOUCHES[anchor]

      const gotTouches = m.touches
      const touchesPairMatches = this.samePair(gotTouches, expectedPair)
      const positionMatchesExpectedSide = m.position === expectedSide
      const anchorTouchesMatches = m.anchorTouches === expectedAnchorTouches

      const ok = uniqueOk && positionMatchesExpectedSide && touchesPairMatches && anchorTouchesMatches

      // log par anchor (très lisible)
      this.logger.log(
        `[anch:${id}] anchor=${anchor} ok=${ok} ` +
          `pos ${m.position} vs exp ${expectedSide} | ` +
          `touches ${JSON.stringify(gotTouches)} vs exp ${JSON.stringify(expectedPair)} | ` +
          `anchorTouches ${m.anchorTouches} vs exp ${expectedAnchorTouches} | ` +
          `anchorOrientation=${m.anchorOrientation}`
      )

      out[id] = {
        ok,
        details: {
          anchor,
          expected: { side: expectedSide, touchesPair: expectedPair, anchorTouches: expectedAnchorTouches },
          got: {
            position: m.position,
            touches: gotTouches,
            anchorTouches: m.anchorTouches,
            anchorOrientation: m.anchorOrientation
          },
          checks: {
            anchorUnique: uniqueOk,
            positionMatchesExpectedSide,
            touchesPairMatches,
            anchorTouchesMatches
          }
        }
      }
    }

    // gros récap
    const summary = Object.fromEntries((Object.keys(out) as AnchorId[]).map((k) => [k, out[k].ok]))
    this.logger.log(`[board] Summary anchors ok: ${JSON.stringify(summary)}`)

    return out
  }

  private samePair(a: [FixedWord, FixedWord], b: [FixedWord, FixedWord]) {
    // ignore order
    const as = [...a].sort().join('|')
    const bs = [...b].sort().join('|')
    return as === bs
  }

  private normSide(x: any): Side {
    const s = String(x ?? '')
      .toLowerCase()
      .trim()
    if (s === 'haut' || s === 'bas' || s === 'gauche' || s === 'droite') return s
    // fallback: si le modèle dévie, on force une valeur (mais on log)
    this.logger.warn(`[normSide] unexpected value="${String(x)}" -> forcing "haut"`)
    return 'haut'
  }

  private normFixed(x: any): FixedWord {
    const s = String(x ?? '')
      .toLowerCase()
      .trim()
    if (FIXED_WORDS.includes(s as any)) return s as FixedWord
    this.logger.warn(`[normFixed] unexpected value="${String(x)}" -> forcing "levre"`)
    return 'levre'
  }

  private normAnchor(x: any): AnchorWord {
    const s = String(x ?? '')
      .toLowerCase()
      .trim()
    if (ANCHOR_WORDS.includes(s as any)) return s as AnchorWord
    this.logger.warn(`[normAnchor] unexpected value="${String(x)}" -> forcing "bouche"`)
    return 'bouche'
  }

  private normTouches(x: any): [FixedWord, FixedWord] {
    // eslint-disable-next-line no-magic-numbers
    if (Array.isArray(x) && x.length === 2) {
      return [this.normFixed(x[0]), this.normFixed(x[1])]
    }
    this.logger.warn(`[normTouches] unexpected value="${JSON.stringify(x)}" -> forcing ["levre","biberon"]`)
    return ['levre', 'biberon']
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
