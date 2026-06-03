/**
 * Utilitaires van partagés entre web-ghost-player et web-ghost-dashboard.
 * Aucune dépendance DOM ni Node.js — safe dans tout environnement.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type VanObjective = {
  objective: string
  completed: boolean
}

export type VanBackgroundMusic = {
  title: string
  url: string
  volume: number
  loop: boolean
  playing: boolean
}

export type VanSoundCue = {
  id: string
  label: string
  url: string
  volume: number
  lastTriggeredAt?: string
}

export type VanMessage = {
  id: string
  kind: 'audio' | 'text' | 'text_image'
  title: string
  text?: string
  audioUrl?: string
  imageUrl?: string
  sentAt?: string
}

// ─── Constantes d'objectifs ──────────────────────────────────────────────────

export const VAN_OBJECTIVE_INTRO = 'Intro terminee'
export const VAN_OBJECTIVE_MATERIAL = 'Récupérer le matériel de localisation'
export const VAN_OBJECTIVE_LOCATE = "Trouver la zone d'activité du fantôme"
export const VAN_OBJECTIVE_IDENTIFICATION_GEAR = "Récupérer le matériel d'identification"
export const VAN_OBJECTIVE_GHOST = 'Identifier le fantôme'
export const VAN_OBJECTIVE_BANISH = 'Bannir le fantôme'

export const DEFAULT_VAN_OBJECTIVES: VanObjective[] = [
  { objective: VAN_OBJECTIVE_INTRO, completed: false },
  { objective: VAN_OBJECTIVE_MATERIAL, completed: false },
  { objective: VAN_OBJECTIVE_LOCATE, completed: false },
  { objective: VAN_OBJECTIVE_IDENTIFICATION_GEAR, completed: false },
  { objective: VAN_OBJECTIVE_GHOST, completed: false },
  { objective: VAN_OBJECTIVE_BANISH, completed: false },
]

// ─── Helpers texte ───────────────────────────────────────────────────────────

export function normalizeVanText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function isVanObjectiveMatch(value: string, expected: string): boolean {
  return normalizeVanText(value) === normalizeVanText(expected)
}

// ─── Objectifs ───────────────────────────────────────────────────────────────

export function ensureVanObjectives(objectives: VanObjective[]): VanObjective[] {
  const normalized: VanObjective[] = objectives.map(item => ({
    objective: item.objective,
    completed: Boolean(item.completed),
  }))

  DEFAULT_VAN_OBJECTIVES.forEach(required => {
    if (!normalized.some(item => isVanObjectiveMatch(item.objective, required.objective))) {
      normalized.push({ ...required })
    }
  })

  return normalized
}

export function deriveVanObjectiveStep(objectives: VanObjective[]): number {
  const normalized = ensureVanObjectives(objectives)
  let count = 0

  for (const expected of DEFAULT_VAN_OBJECTIVES) {
    const matched = normalized.find(item => isVanObjectiveMatch(item.objective, expected.objective))
    if (!matched?.completed) {
      break
    }
    count += 1
  }

  return count
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

export function createDefaultVanBackgroundMusic(): VanBackgroundMusic {
  return { title: '', url: '', volume: 70, loop: true, playing: false }
}

export function parseVanBackgroundMusic(raw?: string): VanBackgroundMusic {
  if (!raw) return createDefaultVanBackgroundMusic()

  try {
    const parsed = JSON.parse(raw) as Partial<VanBackgroundMusic>
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      url: typeof parsed.url === 'string' ? parsed.url : '',
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.volume))) : 70,
      loop: parsed.loop ?? true,
      playing: parsed.playing ?? false,
    }
  } catch {
    return createDefaultVanBackgroundMusic()
  }
}

export function parseVanSoundboard(raw?: string): VanSoundCue[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Array<Partial<VanSoundCue>>
    return parsed
      .filter(item => item && typeof item === 'object')
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `cue-${index}`,
        label: typeof item.label === 'string' ? item.label : '',
        url: typeof item.url === 'string' ? item.url : '',
        volume: typeof item.volume === 'number' ? Math.max(0, Math.min(100, Math.round(item.volume))) : 80,
        lastTriggeredAt: typeof item.lastTriggeredAt === 'string' ? item.lastTriggeredAt : undefined,
      }))
  } catch {
    return []
  }
}

export function parseVanObjectives(raw?: string): VanObjective[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Array<Partial<VanObjective>>
    return parsed
      .filter(item => item && typeof item === 'object' && typeof item.objective === 'string')
      .map(item => ({ objective: item.objective as string, completed: Boolean(item.completed) }))
  } catch {
    return []
  }
}

// ─── Textes personnalisables du van ──────────────────────────────────────────

export type VanTextConfig = {
  intro: {
    title: string
    body: string
    buttonIdle: string
    buttonPlaying: string
  }
  banners: {
    step1: string
    step2: string
    step3: string
    step4: string
    step5: string
    step6: string
    step7: string
  }
  hints: {
    material: string
    locate: string
    identificationGear: string
    ghost: string
  }
  identification: {
    formTitle: string
    placeholder: string
    buttonLabel: string
  }
  banish: {
    sideTitle: string
    sideDescription: string
    fullTitle: string
    imageUrl: string
    fullInstruction: string
  }
  victory: {
    title: string
    subtitle: string
    photoPlaceholder: string
  }
}

export const DEFAULT_VAN_TEXT_CONFIG: VanTextConfig = {
  intro: {
    title: 'MESSAGE EN ATTENTE',
    body: "Une transmission cryptée vient d'être interceptée. Les équipements de détection sont en veille. Initialisez le système pour recevoir le briefing de mission — les coordonnées de l'entité sont attendues.",
    buttonIdle: 'INITIALISER',
    buttonPlaying: '— TRANSMISSION EN COURS —',
  },
  banners: {
    step1: 'Lecture du message',
    step2: 'Récupérer le matériel de localisation',
    step3: "Trouver la zone d'activité du fantôme",
    step4: "Récupérer le matériel d'identification",
    step5: 'Identifier le fantôme',
    step6: 'Bannir le fantôme',
    step7: 'Victoire',
  },
  hints: {
    material: "Récupérer le capteur EMF et le Thermomètre au rez-de-chaussée, ne montez pas à l'étage !",
    locate: "Utilisez le matériel de localisation pour repérer la pièce où se trouve le fantôme puis sélectionnez-la dans la liste déroulante.",
    identificationGear: 'Récupérer la lampe UV, la Camera Ghost et la Spirit Box.',
    ghost: 'Utilisez le matériel à votre disposition pour identifier le fantôme. Saisissez son nom après identification.',
  },
  identification: {
    formTitle: 'Saisir le nom du spectre',
    placeholder: 'Nom du spectre',
    buttonLabel: 'Valider',
  },
  banish: {
    sideTitle: 'Bannir le fantôme',
    sideDescription:
      "Le Spectre déteste le bonheur. Une personne qui a un heureux évènement à venir doit se rendre dans la salle du fantôme et s'en vanter très fort pour le faire apparaître. Une fois sur place, il faudra avoir l'air TERRIFIÉ et se prendre en photo avec la caméra fantôme pour qu'il soit satisfait et disparaisse.",
    fullTitle: 'BANNIR LE FANTÔME',
    imageUrl: 'https://l7r.fr/l7r/GhostBanish.jpg',
    fullInstruction:
      "Le Spectre déteste le bonheur : vantez-vous très fort d'un heureux évènement à venir pour le faire apparaître, puis ayez l'air TERRIFIÉ et prenez-vous en photo pour qu'il disparaisse.",
  },
  victory: {
    title: 'VOUS AVEZ RÉUSSI À CHASSER LE FANTÔME !',
    subtitle: 'BRAVO !',
    photoPlaceholder: 'En attente de la photo finale…',
  },
}

export function parseVanTextConfig(raw?: string): VanTextConfig {
  if (!raw) return { ...DEFAULT_VAN_TEXT_CONFIG, banners: { ...DEFAULT_VAN_TEXT_CONFIG.banners }, hints: { ...DEFAULT_VAN_TEXT_CONFIG.hints }, intro: { ...DEFAULT_VAN_TEXT_CONFIG.intro }, identification: { ...DEFAULT_VAN_TEXT_CONFIG.identification }, banish: { ...DEFAULT_VAN_TEXT_CONFIG.banish }, victory: { ...DEFAULT_VAN_TEXT_CONFIG.victory } }
  try {
    const parsed = JSON.parse(raw) as Partial<VanTextConfig>
    return {
      intro: { ...DEFAULT_VAN_TEXT_CONFIG.intro, ...(parsed.intro ?? {}) },
      banners: { ...DEFAULT_VAN_TEXT_CONFIG.banners, ...(parsed.banners ?? {}) },
      hints: { ...DEFAULT_VAN_TEXT_CONFIG.hints, ...(parsed.hints ?? {}) },
      identification: { ...DEFAULT_VAN_TEXT_CONFIG.identification, ...(parsed.identification ?? {}) },
      banish: { ...DEFAULT_VAN_TEXT_CONFIG.banish, ...(parsed.banish ?? {}) },
      victory: { ...DEFAULT_VAN_TEXT_CONFIG.victory, ...(parsed.victory ?? {}) },
    }
  } catch {
    return parseVanTextConfig(undefined)
  }
}

export function parseVanMessages(raw?: string): VanMessage[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Array<Partial<VanMessage>>
    return parsed
      .filter(item => item && typeof item === 'object')
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `van-msg-${index}`,
        kind:
          item.kind === 'audio' || item.kind === 'text' || item.kind === 'text_image'
            ? item.kind
            : 'text',
        title: typeof item.title === 'string' ? item.title : `Message ${index + 1}`,
        text: typeof item.text === 'string' ? item.text : undefined,
        audioUrl: typeof item.audioUrl === 'string' ? item.audioUrl : undefined,
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
        sentAt: typeof item.sentAt === 'string' ? item.sentAt : undefined,
      }))
  } catch {
    return []
  }
}
