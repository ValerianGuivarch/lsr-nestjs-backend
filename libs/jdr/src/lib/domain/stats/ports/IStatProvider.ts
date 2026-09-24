import { Stat } from '../Stat'

export interface IStatProvider {
  add(jdrSlug: string, p: { name: string }): Promise<Stat>
  update(jdrSlug: string, statSlug: string, p: { name: string }): Promise<Stat>
  remove(jdrSlug: string, statSlug: string): Promise<void>
}
