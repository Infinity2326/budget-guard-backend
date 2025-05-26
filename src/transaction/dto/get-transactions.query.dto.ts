import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, IsDate } from 'class-validator'

export class GetTransactionsQuery {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  from?: string

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  to?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number
}
