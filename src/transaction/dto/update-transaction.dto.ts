import { Type } from 'class-transformer'
import {
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

export class UpdateTransaction {
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsString()
  @IsOptional()
  categoryId?: string

  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  amount?: string

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date

  @IsString()
  @IsOptional()
  description?: string
}
