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
  email: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsStrongPassword({ minLength: 6 })
  @IsString()
  @IsNotEmpty()
  password: string

  @IsStrongPassword({ minLength: 6 })
  @IsString()
  @IsNotEmpty()
  passwordRepeat: string
}
