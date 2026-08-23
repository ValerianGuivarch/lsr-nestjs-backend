import { JdrClass } from '../../domain/classes/JdrClass'
import { DBJdrClass } from './database/jdr-class.db'

export class ClassMapper {
  static toDomain(db: DBJdrClass): JdrClass {
    return new JdrClass({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      text: db.text,
      levels: db.levels
    })
  }
}
