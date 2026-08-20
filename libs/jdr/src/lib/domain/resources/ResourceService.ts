import { Inject, Injectable } from '@nestjs/common'
import { Resource } from './Resource'
import { GroupResourceValue } from './GroupResourceValue'
import { IResourceProvider } from './ports/IResourceProvider'

@Injectable()
export class ResourceService {
  constructor(@Inject('IResourceProvider') private readonly resourceProvider: IResourceProvider) {}

  add(jdrSlug: string, p: { name: string; type: string }): Promise<Resource> {
    return this.resourceProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }): Promise<Resource> {
    return this.resourceProvider.update(jdrSlug, resourceSlug, p)
  }

  remove(jdrSlug: string, resourceSlug: string): Promise<void> {
    return this.resourceProvider.remove(jdrSlug, resourceSlug)
  }

  updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<GroupResourceValue> {
    return this.resourceProvider.updateGroupResource(jdrSlug, resourceSlug, value)
  }
}
