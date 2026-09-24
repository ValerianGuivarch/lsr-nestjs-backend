import { Player } from '../Player'

export interface IPlayerProvider {
  add(jdrSlug: string, p: { name: string }): Promise<Player>
  update(jdrSlug: string, playerSlug: string, p: { name?: string }): Promise<Player>
  remove(jdrSlug: string, playerSlug: string): Promise<void>
}
