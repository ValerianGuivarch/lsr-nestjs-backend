import { DBApotheose } from './DBApotheose'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBBloodlineApotheose {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  bloodlineName: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  bloodline: DBBloodline

  @Column({ type: 'varchar', nullable: false })
  apotheoseName: string

  @ManyToOne(() => DBApotheose)
  @JoinColumn({ name: 'apotheoseName' })
  apotheose: DBApotheose
}
