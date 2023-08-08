import { PrimaryColumn, Entity, Column } from 'typeorm'

@Entity()
export class DBClasse {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', default: '' })
  displayMale: string

  @Column({ type: 'varchar', default: '' })
  displayFemale: string
}
