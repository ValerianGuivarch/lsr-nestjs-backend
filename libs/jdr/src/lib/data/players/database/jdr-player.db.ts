import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm'
import { DBJdrCharacter } from '../../characters/database/jdr-character.db'
import { DBJdr } from '../../jdr/database/DBJdr'

@Entity({ name: 'jdr_player' })
export class DBJdrPlayer {
  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @OneToMany(() => DBJdrCharacter, (character) => character.player)
  characters: DBJdrCharacter[]
}
