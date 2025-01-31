import { DBBloodline } from './DBBloodline'
import { DBProficiency } from '../proficiencies/DBProficiency'
import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity()
@Index(['bloodline', 'proficiency'], { unique: true }) // Garantit l'unicité logique
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
