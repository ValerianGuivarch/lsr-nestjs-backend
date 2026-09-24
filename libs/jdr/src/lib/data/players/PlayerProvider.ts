import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { IPlayerProvider } from '../../domain/players/ports/IPlayerProvider'
import { Player } from '../../domain/players/Player'
import { JdrError } from '../../domain/shared/JdrError'
import { Slug } from '../../domain/shared/Slug'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrCharacter } from '../characters/database/jdr-character.db'
import { PlayerMapper } from './PlayerMapper'
import { DBJdrPlayer } from './database/jdr-player.db'

@Injectable()
export class PlayerProvider implements IPlayerProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrPlayer, 'jdr-sqlite') private readonly playerRepo: Repository<DBJdrPlayer>
  ) {}

  async add(jdrSlug: string, p: { name: string }): Promise<Player> {
    if (!(await this.jdrRepo.existsBy({ slug: jdrSlug }))) throw JdrError.notFound(`Jdr ${jdrSlug}`)
    const slug = Slug.from(p.name)
    if (await this.playerRepo.existsBy({ jdrSlug, slug }))
      throw JdrError.conflict(`Player '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.playerRepo.save(this.playerRepo.create({ jdrSlug, slug, name: p.name }))
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, playerSlug: string, p: { name?: string }): Promise<Player> {
    if (!(await this.playerRepo.existsBy({ jdrSlug, slug: playerSlug })))
      throw JdrError.notFound(`Player '${playerSlug}'`)
    if (p.name !== undefined) await this.playerRepo.update({ jdrSlug, slug: playerSlug }, { name: p.name })
    return this.findOneOrThrow(jdrSlug, playerSlug)
  }

  async remove(jdrSlug: string, playerSlug: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(DBJdrCharacter).update({ jdrSlug, playerSlug }, { playerSlug: null })
      await manager.getRepository(DBJdrPlayer).delete({ jdrSlug, slug: playerSlug })
    })
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Player> {
    const player = await this.playerRepo.findOneBy({ jdrSlug, slug })
    if (!player) throw JdrError.notFound(`Player '${slug}'`)
    return PlayerMapper.toDomain(player)
  }
}
