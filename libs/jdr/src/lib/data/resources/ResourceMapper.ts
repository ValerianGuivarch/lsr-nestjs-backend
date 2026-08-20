import { Resource } from '../../domain/resources/Resource'
import { GroupResourceValue } from '../../domain/resources/GroupResourceValue'
import { DBJdrResource } from './database/jdr-resource.db'
import { DBJdrGroupResource } from './database/jdr-group-resource.db'

export class ResourceMapper {
  static toDomain(db: DBJdrResource): Resource {
    return new Resource({ jdrSlug: db.jdrSlug, name: db.name, slug: db.slug, type: db.type })
  }

  static toGroupResourceValue(db: DBJdrGroupResource): GroupResourceValue {
    return new GroupResourceValue({ resourceSlug: db.resourceSlug, value: db.value })
  }
}
