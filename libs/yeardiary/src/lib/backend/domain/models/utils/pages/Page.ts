import { PageOptions } from './PageOptions'
import { PageOrder } from './PageOrder'

export class Page<T> {
  readonly items: T[]
  readonly pageData: PageData

  constructor(p: { items: T[]; total: number; pageOptions: PageOptions }) {
    this.items = p.items
    this.pageData = {
      total: p.total,
      page: p.pageOptions.page,
      perPage: p.pageOptions.perPage,
      order: p.pageOptions.order
    }
  }

  map<U>(fn: (item: T) => U): Page<U> {
    return new Page({
      items: this.items.map(fn),
      total: this.pageData.total,
      pageOptions: new PageOptions({
        page: this.pageData.page,
        perPage: this.pageData.perPage,
        order: this.pageData.order
      })
    })
  }

  async mapAsync<U>(fn: (item: T) => Promise<U>): Promise<Page<U>> {
    return new Page({
      items: await Promise.all(this.items.map(fn)),
      total: this.pageData.total,
      pageOptions: new PageOptions({
        page: this.pageData.page,
        perPage: this.pageData.perPage,
        order: this.pageData.order
      })
    })
  }
}

interface PageData {
  readonly order: PageOrder
  readonly total: number
  readonly page: number
  readonly perPage: number
}
