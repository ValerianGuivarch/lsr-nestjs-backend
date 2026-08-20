import { Resource } from '../Resource'
import { GroupResourceValue } from '../GroupResourceValue'

export interface IResourceProvider {
  add(jdrSlug: string, p: { name: string; type: string }): Promise<Resource>
  update(jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }): Promise<Resource>
  remove(jdrSlug: string, resourceSlug: string): Promise<void>
  updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<GroupResourceValue>
}
