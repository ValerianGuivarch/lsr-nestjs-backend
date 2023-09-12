import { CharacterTemplateReferential } from '../../../domain/models/invocation/CharacterTemplateReferential'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBClasse } from '../classes/DBClasse'
import { DBSkill } from '../skills/DBSkill'
import { IsDefined, IsObject, IsOptional } from 'class-validator'
import { PrimaryColumn, Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm'

@Entity()
export class DBCharacterTemplate {
  @PrimaryColumn({ type: 'varchar' })
  @IsDefined()
  name: string

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  @IsDefined()
  chairValueReferential: string

  @Column({ type: 'int' })
  @IsDefined()
  chairValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  @IsDefined()
  espritValueReferential: string

  @Column({ type: 'int' })
  @IsDefined()
  espritValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  @IsDefined()
  essenceValueReferential: string

  @Column({ type: 'int' })
  @IsDefined()
  essenceValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  @IsDefined()
  pvMaxValueReferential: string

  @Column({ type: 'int' })
  @IsDefined()
  pvMaxValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  @IsDefined()
  pfMaxValueReferential: string

  @Column({ type: 'int' })
  @IsDefined()
  pfMaxValueRule: number

  @Column({
    type: 'enum',
    enum: CharacterTemplateReferential
  })
  @IsDefined()
  ppMaxValueReferential: string

  @Column({ type: 'int' })
  @IsDefined()
  ppMaxValueRule: number

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  picture?: string

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  customData?: string

  @Column()
  @IsDefined()
  classeName: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  @IsDefined()
  @IsObject()
  classe: DBClasse

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  bloodlineName?: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  @IsDefined()
  @IsObject()
  bloodline: DBBloodline

  @ManyToMany(() => DBSkill, (skill) => skill.characterTemplates, {
    cascade: ['remove']
  })
  @JoinTable()
  @IsDefined()
  @IsObject()
  skills: DBSkill[]
}
