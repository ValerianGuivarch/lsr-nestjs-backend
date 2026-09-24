import { Inject, Injectable } from '@nestjs/common'
import { Item } from './Item'
import { OwnedItem } from './OwnedItem'
import { IItemProvider } from './ports/IItemProvider'

@Injectable()
export class ItemService {
  constructor(@Inject('IItemProvider') private readonly itemProvider: IItemProvider) {}

  add(jdrSlug: string, p: Parameters<IItemProvider['add']>[1]): Promise<Item> {
    return this.itemProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, itemSlug: string, p: Parameters<IItemProvider['update']>[2]): Promise<Item> {
    return this.itemProvider.update(jdrSlug, itemSlug, p)
  }

  remove(jdrSlug: string, itemSlug: string): Promise<void> {
    return this.itemProvider.remove(jdrSlug, itemSlug)
  }

  addGroupItem(jdrSlug: string, p: { itemSlug: string; quantity?: number }): Promise<OwnedItem> {
    return this.itemProvider.addGroupItem(jdrSlug, p)
  }

  removeGroupItem(jdrSlug: string, itemSlug: string): Promise<void> {
    return this.itemProvider.removeGroupItem(jdrSlug, itemSlug)
  }
}
