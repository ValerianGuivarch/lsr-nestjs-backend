import { Trait } from '../Trait'

export interface ITraitProvider {
  add(jdrSlug: string, p: { name: string; type: string; level?: number; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Trait>
  update(jdrSlug: string, traitSlug: string, p: { name?: string; type?: string; level?: number | null; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Trait>
  remove(jdrSlug: string, traitSlug: string): Promise<void>
}
