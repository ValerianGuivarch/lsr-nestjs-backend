import { Page } from '../../../../../domain/models/utils/pages/Page'
import { PageOrder } from '../../../../../domain/models/utils/pages/PageOrder'
import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEnum, IsNumber, IsObject } from 'class-validator'

export class PageVM<T> {
  @ApiProperty({
    isArray: true,
    description: 'The list of items',
    type: 'object'
  })
  @IsObject({ each: true })
  @IsArray({ each: true })
  readonly items: T[]

  @ApiProperty({ enum: PageOrder, enumName: 'PageOrder' })
  @IsEnum(PageOrder)
  readonly order: PageOrder

  @ApiProperty({ type: 'number' })
  @IsNumber()
  readonly total: number

  @ApiProperty({
    description: 'The current page'
  })
  @IsNumber()
  readonly page: number

  @ApiProperty()
  @IsNumber()
  readonly pages: number

  @ApiProperty()
  @IsNumber()
  readonly perPage: number

  constructor(p: PageVM<T>) {
    this.items = p.items
    this.total = p.total
    this.page = p.page
    this.pages = p.pages
    this.perPage = p.perPage
    this.order = p.order
  }

  static fromPage<T>(page: Page<T>): PageVM<T> {
    return new PageVM({
      items: page.items,
      total: page.pageData.total,
      page: page.pageData.page,
      perPage: page.pageData.perPage,
      order: page.pageData.order,
      pages: Math.ceil(page.pageData.total / page.pageData.perPage)
    })
  }

  static fromPageWithVMS<T>(page: Page<object>, items: T[]): PageVM<T> {
    return new PageVM({
      items: items,
      total: page.pageData.total,
      page: page.pageData.page,
      perPage: page.pageData.perPage,
      order: page.pageData.order,
      pages: Math.ceil(page.pageData.total / page.pageData.perPage)
    })
  }

  static from<T>(page: Page<T>, items: T[]): PageVM<T> {
    return new PageVM({
      items: items,
      total: page.pageData.total,
      page: page.pageData.page,
      perPage: page.pageData.perPage,
      order: page.pageData.order,
      pages: Math.ceil(page.pageData.total / page.pageData.perPage)
    })
  }

  static emptyPage<T>(): PageVM<T> {
    return new PageVM({
      items: [],
      total: 0,
      page: 0,
      perPage: 0,
      order: PageOrder.ASC,
      pages: 0
    })
  }
}
