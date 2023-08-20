import { CharacterTemplateReferential } from '../../../domain/models/invocation/CharacterTemplateReferential'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBClasse } from '../classes/DBClasse'
import { PrimaryColumn, Entity, Column, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBCharacterTemplate {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  chairValueReferential: string

  @Column({ type: 'int' })
  chairValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  espritValueReferential: string

  @Column({ type: 'int' })
  espritValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  essenceValueReferential: string

  @Column({ type: 'int' })
  essenceValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  pvMaxValueReferential: string

  @Column({ type: 'int' })
  pvMaxValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  pfMaxValueReferential: string

  @Column({ type: 'int' })
  pfMaxValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  ppMaxValueReferential: string

  @Column({ type: 'int' })
  ppMaxValueRule: number

  @Column({ type: 'varchar', nullable: true })
  picture?: string

  @Column({ type: 'varchar', nullable: true })
  customData?: string

  @Column({ type: 'varchar', nullable: true })
  classeName?: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  classe: DBClasse

  @Column({ type: 'varchar', nullable: true })
  bloodlineName?: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  bloodline: DBBloodline
}
