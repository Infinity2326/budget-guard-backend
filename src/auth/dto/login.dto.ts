import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'john@example.com' })
  email: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty({ example: 'StrongPassword!404' })
  password: string
}
