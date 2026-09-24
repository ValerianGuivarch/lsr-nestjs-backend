import { Stat } from '../../../domain/stats/Stat'

export class StatDto implements Pick<Stat, 'slug' | 'name'> {
  slug: string
  name: string
}
