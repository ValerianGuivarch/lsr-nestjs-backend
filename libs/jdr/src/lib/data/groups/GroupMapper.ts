import { JdrGroup } from '../../domain/groups/JdrGroup'
import { DBJdrGroup } from './database/jdr-group.db'
import { ResourceMapper } from '../resources/ResourceMapper'

export class GroupMapper {
  static toDomain(db: DBJdrGroup): JdrGroup {
    return new JdrGroup({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      text: db.text,
      resources: (db.resources ?? []).map(ResourceMapper.toGroupResource)
    })
  }
}
