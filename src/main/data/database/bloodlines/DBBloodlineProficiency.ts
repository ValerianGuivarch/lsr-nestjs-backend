import { DBBloodline } from './DBBloodline'
import { DBProficiency } from '../proficiencies/DBProficiency'
import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class BloodlineProficiency {
  @PrimaryGeneratedColumn('uuid') // Clé primaire pour Directus
  id: string

  @ManyToOne(() => DBBloodline, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bloodlineId' })
  bloodline: DBBloodline

  @ManyToOne(() => DBProficiency, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proficiencyId' })
  proficiency: DBProficiency
}
