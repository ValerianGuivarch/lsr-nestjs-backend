import { DBApotheose } from './DBApotheose'
import { DBClasse } from '../classes/DBClasse'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBClasseApotheose {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  classeName: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  classe: DBClasse

  @Column({ type: 'varchar', nullable: false })
  apotheoseName: string

  @ManyToOne(() => DBApotheose)
  @JoinColumn({ name: 'apotheoseName' })
  apotheose: DBApotheose
}
