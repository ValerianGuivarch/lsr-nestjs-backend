import { Jdr } from '../Jdr'

export interface IJdrProvider {
  findAll(): Promise<Pick<Jdr, 'slug' | 'name'>[]>
  findOneBySlug(jdrSlug: string): Promise<Jdr>
  create(p: { name: string; text?: string }): Promise<Jdr>
  update(jdrSlug: string, p: { name?: string; text?: string }): Promise<Jdr>
  delete(jdrSlug: string): Promise<void>
}
