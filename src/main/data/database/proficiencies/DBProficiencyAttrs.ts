import { Column } from 'typeorm'

export abstract class DBProficiencyAttrs {
  @Column({ type: 'integer', nullable: true })
  minLevel?: number | null
}
