import { CategoryType } from '@prisma/client'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

export class UpdateCategory {
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType

  @IsString()
  @IsOptional()
  description?: string
}
