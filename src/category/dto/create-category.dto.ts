import { CategoryType } from '@prisma/client'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator'

export class CreateCategory {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string

  @IsString()
  @IsNotEmpty()
  @IsEnum(CategoryType)
  type: CategoryType

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description: string
}
