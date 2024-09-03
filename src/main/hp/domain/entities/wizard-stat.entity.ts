import { Stat } from './stat.entity'

export class WizardStat {
  stat: Stat
  level: number
}
export type WizardStatToCreate = Omit<WizardStat, 'stat'> & {
  stat: Pick<Stat, 'id'>
}
export type WizardStatToUpdate = Pick<WizardStat, 'level'>
