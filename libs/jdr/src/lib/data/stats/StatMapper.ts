import { Stat } from '../../domain/stats/Stat'
import { DBJdrStat } from './database/jdr-stat.db'

export class StatMapper {
  static toDomain(db: DBJdrStat): Stat {
    return new Stat({ jdrSlug: db.jdrSlug, name: db.name, slug: db.slug })
  }
}
