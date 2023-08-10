import { InvocationReferential } from '../../../domain/models/invocation/InvocationReferential'
import { PrimaryColumn, Entity, Column } from 'typeorm'

@Entity()
export class DBInvocationTemplate {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({
    type: 'enum',
    enum: InvocationReferential
  })
  chairValueReferential: string

  @Column({ type: 'int' })
  chairValueRule: number

  @Column({
    type: 'enum',
    enum: InvocationReferential
  })
  espritValueReferential: string

  @Column({ type: 'int' })
  espritValueRule: number

  @Column({
    type: 'enum',
    enum: InvocationReferential
  })
  essenceValueReferential: string

  @Column({ type: 'int' })
  essenceValueRule: number

  @Column({
    type: 'enum',
    enum: InvocationReferential
  })
  pvMaxValueReferential: string

  @Column({ type: 'int' })
  pvMaxValueRule: number

  @Column({ type: 'boolean' })
  healer: boolean

  @Column({ type: 'varchar', nullable: true })
  picture?: string
}
