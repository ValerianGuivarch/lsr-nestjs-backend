import { Resource } from '../../domain/resources/Resource'
import { GroupResource } from '../../domain/resources/GroupResource'
import { DBJdrResource } from './database/jdr-resource.db'
import { DBJdrGroupResource } from './database/jdr-group-resource.db'

export class ResourceMapper {
  static toDomain(db: DBJdrResource): Resource {
    return new Resource({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      ownerType: db.ownerType,
      defaultValue: db.defaultValue
    })
  }

  static toGroupResource(db: DBJdrGroupResource): GroupResource {
    return new GroupResource({ resourceSlug: db.resourceSlug, name: db.name, value: db.value })
  }
}
