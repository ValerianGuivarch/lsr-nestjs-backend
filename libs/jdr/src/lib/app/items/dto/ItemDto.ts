export class StatModifierDto {
  statSlug: string
  value: number
}

export class ItemDto {
  slug: string
  name: string
  description: string
  unique: boolean
  modifiers: StatModifierDto[]
}

export class OwnedItemDto {
  itemSlug: string
  quantity: number
}
