import { Inject, Injectable } from '@nestjs/common'
import { Player } from './Player'
import { IPlayerProvider } from './ports/IPlayerProvider'

@Injectable()
export class PlayerService {
  constructor(@Inject('IPlayerProvider') private readonly playerProvider: IPlayerProvider) {}

  add(jdrSlug: string, p: { name: string }): Promise<Player> {
    return this.playerProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, playerSlug: string, p: { name?: string }): Promise<Player> {
    return this.playerProvider.update(jdrSlug, playerSlug, p)
  }

  remove(jdrSlug: string, playerSlug: string): Promise<void> {
    return this.playerProvider.remove(jdrSlug, playerSlug)
  }
}
