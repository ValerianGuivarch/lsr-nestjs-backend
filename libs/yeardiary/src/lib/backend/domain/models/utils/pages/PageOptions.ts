import { PageOrder } from './PageOrder'

export class PageOptions {
  readonly order: PageOrder
  readonly page: number
  readonly perPage: number

  get skip(): number {
    return (this.page - 1) * this.perPage
  }

  constructor(p: { order: PageOrder; page: number; perPage: number }) {
    this.order = p.order
    this.page = p.page
    this.perPage = p.perPage
  }
}
