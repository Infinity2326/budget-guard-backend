import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from '../user/user.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { verify } from 'argon2'
import { TokenService } from '../token/token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  public async register(registerDto: RegisterDto) {
    const isExistingUser = await this.userService.getUserByEmail(
      registerDto.email,
    )

    if (isExistingUser) {
      throw new ConflictException('Email already Taken.')
    }

    const { passwordRepeat, ...data } = registerDto

    if (data.password !== passwordRepeat) {
      throw new BadRequestException('Passwords dont match.')
    }

    const user = await this.userService.createUser(data)

    const accessToken = await this.tokenService.generateAccessToken(user.id)
    const refreshToken = await this.tokenService.generateRefreshToken(user.id)

    return { accessToken, refreshToken }
  }

  public async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.')
    }

    const accessToken = await this.tokenService.generateAccessToken(user.id)
    const refreshToken = await this.tokenService.generateRefreshToken(user.id)

    return {
      accessToken,
      refreshToken,
    }
  }

  public async logout(userId: string, refreshToken: string) {
    const isValid = await this.tokenService.validateRefreshToken(
      userId,
      refreshToken,
    )

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token.')
    }

    await this.tokenService.deleteRefreshToken(userId)
  }

  public async refresh(userId: string, oldRefreshToken: string) {
    const isValid = await this.tokenService.validateRefreshToken(
      userId,
      oldRefreshToken,
    )

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token.')
    }

    const newAccessToken = await this.tokenService.generateAccessToken(userId)

    const newRefreshToken = await this.tokenService.rotateRefreshToken(
      userId,
      oldRefreshToken,
    )

    return { newAccessToken, newRefreshToken }
  }

  public async validateUser(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email)

    if (!user) {
      throw new BadRequestException('Can not find user with this email.')
    }

    const isValidPassword = await verify(user.password, password)

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password.')
    }

    return user
  }
}
