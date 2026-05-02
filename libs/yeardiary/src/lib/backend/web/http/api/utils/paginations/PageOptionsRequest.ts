import { PageOptions } from '../../../../../domain/models/utils/pages/PageOptions'
import { PageOrder } from '../../../../../domain/models/utils/pages/PageOrder'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator'

export class PageOptionsRequest {
  @ApiPropertyOptional({ enum: PageOrder, enumName: 'Order', format: 'int32' })
  @IsOptional()
  @IsEnum(PageOrder)
  readonly order?: PageOrder = PageOrder.ASC

  @ApiPropertyOptional({ type: Number, format: 'int32' })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @IsInt()
  readonly page?: number = 1

  @ApiPropertyOptional({ type: Number, format: 'int32' })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(50)
  @IsInt()
  readonly perPage?: number = 20

  toPageOptions(): PageOptions {
    return new PageOptions({
      order: this.order ?? PageOrder.ASC,
      page: this.page ?? 0,
      perPage: this.perPage ?? 20
    })
  }
}
