import { Type } from 'class-transformer'
import { IsOptional, IsDateString, IsInt, Min } from 'class-validator'

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
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
