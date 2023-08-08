import { SuccessCalculation } from '../../../domain/models/roll/SuccessCalculation'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { Column } from 'typeorm'

export abstract class DBSkillAttrs {
  @Column({ type: 'boolean', nullable: true })
  allowsPf: boolean | null

  @Column({ type: 'boolean', nullable: true })
  allowsPp: boolean | null

  @Column({
    type: 'enum',
    enum: SkillStat,
    nullable: true
  })
  stat: string | null

  @Column({ type: 'integer', nullable: true })
  pvCost: number | null

  @Column({ type: 'integer', nullable: true })
  pfCost: number | null

  @Column({ type: 'integer', nullable: true })
  ppCost: number | null

  @Column({ type: 'integer', nullable: true })
  dettesCost: number | null

  @Column({ type: 'integer', nullable: true })
  arcaneCost: number | null

  @Column({ type: 'varchar', nullable: true })
  customRolls: string | null

  @Column({
    type: 'enum',
    enum: SuccessCalculation,
    nullable: true
  })
  successCalculation: string | null

  @Column({ type: 'boolean', nullable: true })
  secret: boolean | null
}
