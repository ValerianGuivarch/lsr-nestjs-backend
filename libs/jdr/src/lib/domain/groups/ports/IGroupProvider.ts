import { JdrGroup } from '../JdrGroup'

export interface IGroupProvider {
  add(jdrSlug: string, p: { name: string; text?: string }): Promise<JdrGroup>
  update(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<JdrGroup>
  remove(jdrSlug: string, groupSlug: string): Promise<void>
}
