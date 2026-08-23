import { JdrGroup } from '../JdrGroup'

export interface IGroupProvider {
  add(jdrSlug: string, p: { name: string; text?: string }): Promise<JdrGroup>
  update(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<JdrGroup>
  remove(jdrSlug: string, groupSlug: string): Promise<void>
  addGroupResource(jdrSlug: string, groupSlug: string, p: { name: string; value?: number }): Promise<JdrGroup>
  updateGroupResource(jdrSlug: string, groupSlug: string, resourceSlug: string, value: number): Promise<JdrGroup>
  removeGroupResource(jdrSlug: string, groupSlug: string, resourceSlug: string): Promise<void>
}
