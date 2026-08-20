import { Item } from '../Item'
import { OwnedItem } from '../OwnedItem'

export interface IItemProvider {
  add(jdrSlug: string, p: { name: string; description?: string; unique?: boolean; modifiers?: { statSlug: string; value: number }[] }): Promise<Item>
  update(jdrSlug: string, itemSlug: string, p: { name?: string; description?: string; unique?: boolean; modifiers?: { statSlug: string; value: number }[] }): Promise<Item>
  remove(jdrSlug: string, itemSlug: string): Promise<void>
  addGroupItem(jdrSlug: string, p: { itemSlug: string; quantity?: number }): Promise<OwnedItem>
  removeGroupItem(jdrSlug: string, itemSlug: string): Promise<void>
}
