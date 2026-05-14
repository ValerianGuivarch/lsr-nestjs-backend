/**
 * Structure du scénario de la partie Ghost
 */

import { ToolType } from './tools.types'

export interface ScenarioStep {
  id: number
  title: string
  description: string
  requiredTools: ToolType[] // outils nécessaires à cette étape
  actions: ScenarioAction[]
  completed: boolean
}

export interface ScenarioAction {
  id: string
  label: string
  description?: string
  type: 'info' | 'trigger' | 'check'
}

/**
 * Scénario codé en dur pour la partie unique
 */
export const GHOST_SCENARIO: ScenarioStep[] = [
  {
    id: 1,
    title: 'Préparation',
    description: 'Installez et testez les équipements',
    requiredTools: [ToolType.EMF, ToolType.SPIRITBOX],
    actions: [
      { id: 'check-emf', label: 'Vérifier l\'EMF', type: 'check' },
      { id: 'check-spiritbox', label: 'Tester le Spirit Box', type: 'check' }
    ],
    completed: false
  },
  {
    id: 2,
    title: 'Première exploration',
    description: 'Explorez le lieu et recherchez des signes d\'activité',
    requiredTools: [ToolType.EMF, ToolType.GHOSTCAM, ToolType.MOTION_SENSOR],
    actions: [
      { id: 'scan-rooms', label: 'Scanner les pièces', type: 'trigger' },
      { id: 'detect-motion', label: 'Détecteur de mouvement activé', type: 'info' }
    ],
    completed: false
  },
  {
    id: 3,
    title: 'Communication',
    description: 'Essayez de communiquer avec l\'entité',
    requiredTools: [ToolType.SPIRITBOX, ToolType.SOUND_DETECTOR],
    actions: [
      { id: 'spiritbox-session', label: 'Démarrer session Spirit Box', type: 'trigger' }
    ],
    completed: false
  },
  {
    id: 4,
    title: 'Montée d\'activité',
    description: 'L\'activité spectrale augmente considérablement',
    requiredTools: [ToolType.EMF, ToolType.GHOSTORBS, ToolType.THERMOMETER],
    actions: [
      { id: 'monitor-activity', label: 'Surveiller l\'activité', type: 'check' },
      { id: 'temperature-drop', label: 'Baisse de température détectée', type: 'info' }
    ],
    completed: false
  },
  {
    id: 5,
    title: 'Chasse',
    description: 'La chasse commence, le fantôme manifeste sa présence',
    requiredTools: [ToolType.VAN],
    actions: [
      { id: 'ghost-hunt', label: 'La chasse est lancée', type: 'trigger' }
    ],
    completed: false
  }
]
