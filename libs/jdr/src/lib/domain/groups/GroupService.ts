import { Inject, Injectable } from '@nestjs/common'
import { JdrGroup } from './JdrGroup'
import { IGroupProvider } from './ports/IGroupProvider'

@Injectable()
export class GroupService {
  constructor(@Inject('IGroupProvider') private readonly groupProvider: IGroupProvider) {}

  add(jdrSlug: string, p: { name: string; text?: string }): Promise<JdrGroup> {
    return this.groupProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<JdrGroup> {
    return this.groupProvider.update(jdrSlug, groupSlug, p)
  }

  remove(jdrSlug: string, groupSlug: string): Promise<void> {
    return this.groupProvider.remove(jdrSlug, groupSlug)
  }

  addGroupResource(jdrSlug: string, groupSlug: string, p: { name: string; value?: number }): Promise<JdrGroup> {
    return this.groupProvider.addGroupResource(jdrSlug, groupSlug, p)
  }

  updateGroupResource(jdrSlug: string, groupSlug: string, resourceSlug: string, value: number): Promise<JdrGroup> {
    return this.groupProvider.updateGroupResource(jdrSlug, groupSlug, resourceSlug, value)
  }

  removeGroupResource(jdrSlug: string, groupSlug: string, resourceSlug: string): Promise<void> {
    return this.groupProvider.removeGroupResource(jdrSlug, groupSlug, resourceSlug)
  }
}
