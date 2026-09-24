import { Player } from '../../domain/players/Player'
import { DBJdrPlayer } from './database/jdr-player.db'

export class PlayerMapper {
  static toDomain(db: DBJdrPlayer): Player {
    return new Player({ jdrSlug: db.jdrSlug, slug: db.slug, name: db.name })
  }
}
