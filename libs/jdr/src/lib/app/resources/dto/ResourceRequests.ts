import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { ResourceOwnerType } from '../../../domain/resources/ResourceType'

export class AddResourceRequest {
  @IsString() name: string
  @IsEnum(ResourceOwnerType) ownerType: ResourceOwnerType
  @IsOptional() @IsNumber() defaultValue?: number
}

export class UpdateResourceRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsNumber() defaultValue?: number
}
