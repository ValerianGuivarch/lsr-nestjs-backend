import { Constellation } from '../../domain/models/elena/Constellation'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('Constellation')
export class DBConstellation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  realName: string

  @Column()
  pictureUrl: string

  @Column()
  pictureUrlRevealed: string

  @Column({
    default: false
  })
  revealed: boolean

  @Column({
    default: false
  })
  isStarStream: boolean

  @Column({
    default: false
  })
  sponsor: boolean

  static readonly RELATIONS = {}

  static toConstellation(dbConstellation: DBConstellation): Constellation {
    return new Constellation({
      id: dbConstellation.id,
      name: dbConstellation.name,
      realName: dbConstellation.realName,
      pictureUrl: dbConstellation.pictureUrl,
      pictureUrlRevealed: dbConstellation.pictureUrlRevealed,
      revealed: dbConstellation.revealed,
      isStarStream: dbConstellation.isStarStream,
      sponsor: dbConstellation.sponsor
    })
  }
}

export type DBConstellationToCreate = Omit<DBConstellation, 'id'>
