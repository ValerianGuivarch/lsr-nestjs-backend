import { PrimaryColumn, Entity } from 'typeorm'

@Entity()
export class DBClasse {
  @PrimaryColumn({ type: 'varchar' })
  name: string
}
