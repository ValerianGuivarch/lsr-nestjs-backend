import { JdrClass } from '../../domain/classes/JdrClass'
import { ClassResourceProfile } from '../../domain/classes/ClassResourceProfile'
import { DBJdrClass } from './database/jdr-class.db'
import { DBJdrClassResource } from './database/jdr-class-resource.db'

export class ClassMapper {
  static toDomain(db: DBJdrClass): JdrClass {
    return new JdrClass({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      text: db.text,
      level: db.level,
      resources: (db.resources ?? []).map(ClassMapper.toResourceProfile)
    })
  }

  static toResourceProfile(db: DBJdrClassResource): ClassResourceProfile {
    return new ClassResourceProfile({
      jdrSlug: db.jdrSlug,
      classSlug: db.classSlug,
      resourceSlug: db.resourceSlug,
      resourceType: db.resourceType,
      defaultValue: db.defaultValue,
      behavior: db.behavior
    })
  }
}
