import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator'

export class RegisterDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'john@example.com' })
  email: string

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'john' })
  name: string

  @IsStrongPassword({ minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'StrongPassword!404' })
  password: string

  @IsStrongPassword({ minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'StrongPassword!404' })
  passwordRepeat: string
}
