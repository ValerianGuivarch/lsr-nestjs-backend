import { JdrClass } from '../JdrClass'

export interface IClassProvider {
  add(jdrSlug: string, p: { name: string; levels?: string[]; text?: string }): Promise<JdrClass>
  update(jdrSlug: string, classSlug: string, p: { name?: string; levels?: string[]; text?: string }): Promise<JdrClass>
  remove(jdrSlug: string, classSlug: string): Promise<void>
}
