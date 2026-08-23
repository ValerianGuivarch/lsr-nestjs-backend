import { Inject, Injectable } from '@nestjs/common'
import { JdrClass } from './JdrClass'
import { IClassProvider } from './ports/IClassProvider'

@Injectable()
export class ClassService {
  constructor(@Inject('IClassProvider') private readonly classProvider: IClassProvider) {}

  add(jdrSlug: string, p: { name: string; levels?: string[]; text?: string }): Promise<JdrClass> {
    return this.classProvider.add(jdrSlug, p)
  }

  update(
    jdrSlug: string,
    classSlug: string,
    p: { name?: string; levels?: string[]; text?: string }
  ): Promise<JdrClass> {
    return this.classProvider.update(jdrSlug, classSlug, p)
  }

  remove(jdrSlug: string, classSlug: string): Promise<void> {
    return this.classProvider.remove(jdrSlug, classSlug)
  }
}
