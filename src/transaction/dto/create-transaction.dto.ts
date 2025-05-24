import { Type } from 'class-transformer'
import {
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateTransaction {
  @IsString()
  @IsNotEmpty()
  categoryId: string

  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  amount: number

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date: Date

  @IsString()
  @IsOptional()
  description?: string
}
