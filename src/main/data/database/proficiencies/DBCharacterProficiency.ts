import { DBProficiency } from './DBProficiency'
import { DBProficiencyAttrs } from './DBProficiencyAttrs'
import { DBCharacter } from '../character/DBCharacter'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBCharacterProficiency extends DBProficiencyAttrs {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  characterName: string

  @ManyToOne(() => DBCharacter)
  @JoinColumn({ name: 'characterName' })
  character: DBCharacter

  @Column({ type: 'varchar', nullable: false })
  proficiencyName: string

  @ManyToOne(() => DBProficiency)
  @JoinColumn({ name: 'proficiencyName' })
  proficiency: DBProficiency
}
