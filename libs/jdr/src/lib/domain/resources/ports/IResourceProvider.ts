import { Resource } from '../Resource'
import { ResourceOwnerType } from '../ResourceType'

export interface IResourceProvider {
  add(jdrSlug: string, p: { name: string; ownerType: ResourceOwnerType; defaultValue?: number }): Promise<Resource>
  update(jdrSlug: string, resourceSlug: string, p: { name?: string; defaultValue?: number }): Promise<Resource>
  remove(jdrSlug: string, resourceSlug: string): Promise<void>
}
