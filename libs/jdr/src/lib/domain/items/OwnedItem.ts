import { assertFinitePositiveInteger } from '../shared/Guards'
import { Slug } from '../shared/Slug'

export class OwnedItem {
  itemSlug: string
  quantity: number

  constructor(p: { itemSlug: string; quantity?: number }) {
    this.itemSlug = p.itemSlug
    this.quantity = p.quantity ?? 1

    Slug.assertValid(this.itemSlug)
    assertFinitePositiveInteger(this.quantity, 'OwnedItem.quantity')
  }
}
