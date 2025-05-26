import { Type } from 'class-transformer'
import {
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

export class CreateTransaction {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string

  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  amount: string

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date: Date

  @IsString()
  @IsOptional()
  description?: string
}
