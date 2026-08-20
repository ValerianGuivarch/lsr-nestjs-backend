import { Inject, Injectable } from '@nestjs/common'
import { JdrClass } from './JdrClass'
import { ClassResourceProfile } from './ClassResourceProfile'
import { IClassProvider } from './ports/IClassProvider'

@Injectable()
export class ClassService {
  constructor(@Inject('IClassProvider') private readonly classProvider: IClassProvider) {}

  add(jdrSlug: string, p: { name: string; level: number; text?: string }): Promise<JdrClass> {
    return this.classProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }): Promise<JdrClass> {
    return this.classProvider.update(jdrSlug, classSlug, p)
  }

  remove(jdrSlug: string, classSlug: string): Promise<void> {
    return this.classProvider.remove(jdrSlug, classSlug)
  }

  addClassResource(jdrSlug: string, classSlug: string, p: Parameters<IClassProvider['addClassResource']>[2]): Promise<ClassResourceProfile> {
    return this.classProvider.addClassResource(jdrSlug, classSlug, p)
  }

  removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<void> {
    return this.classProvider.removeClassResource(jdrSlug, classSlug, resourceSlug)
  }
}
