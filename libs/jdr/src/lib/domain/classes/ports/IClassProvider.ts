import { JdrClass } from '../JdrClass'
import { ClassResourceProfile } from '../ClassResourceProfile'

export interface IClassProvider {
  add(jdrSlug: string, p: { name: string; level: number; text?: string }): Promise<JdrClass>
  update(jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }): Promise<JdrClass>
  remove(jdrSlug: string, classSlug: string): Promise<void>
  addClassResource(jdrSlug: string, classSlug: string, p: { resourceSlug: string; resourceType: string; defaultValue?: number; behavior?: string }): Promise<ClassResourceProfile>
  removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<void>
}
