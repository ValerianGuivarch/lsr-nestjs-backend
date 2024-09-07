import { Stat } from './stat.entity'

export class WizardStat {
  stat: Stat
  level: number
  xp: number
}
export type WizardStatToCreate = Omit<WizardStat, 'stat' | 'xp'> & {
  stat: Pick<Stat, 'name'>
}
export type WizardStatToUpdate = Pick<WizardStat, 'level'> & {
  statName: string
}
