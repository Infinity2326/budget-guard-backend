import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { LocalGuard } from './guards/local.guard'
import { Request, Response } from 'express'
import { TokenService } from '../token/token.service'
import { ConfigService } from '@nestjs/config'

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {}

  private readonly ttl =
    this.config.get<number>('JWT_REFRESH_TOKEN_TTL') || 60 * 60 * 24 * 30 // 30 дней

  cookieOptions = {
    httpOnly: true,
    secure: this.config.get('NODE_ENV') === 'production',
    sameSite: 'lax' as const,
    maxAge: this.ttl,
  }

  @Post('register')
  @ApiOkResponse()
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto)

    res.cookie('refresh_token', refreshToken, this.cookieOptions)
    res.json({ access_token: accessToken })
  }

  @Post('login')
  @ApiOkResponse()
  @UseGuards(LocalGuard)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto)

    res.cookie('refresh_token', refreshToken, this.cookieOptions)
    res.json({ access_token: accessToken })
  }

  @Post('logout')
  @ApiOkResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken: string | undefined = req.cookies[
      'refresh_token'
    ] as string

    const [, accessToken] = req.headers.authorization?.split(' ') ?? []

    const userId = await this.tokenService.getUserIdFromAccessToken(accessToken)

    if (!refreshToken || !userId) {
      throw new UnauthorizedException('Refresh token not found in cookies.')
    }

    await this.authService.logout(userId, refreshToken)

    res.clearCookie('refresh_token', this.cookieOptions)
    res.json({ message: 'Logged out successfully' })
  }

  @Post('refresh')
  @ApiOkResponse()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const [, token] = req.headers.authorization?.split(' ') ?? []

    const refreshToken = req.cookies['refresh_token'] as string

    if (!refreshToken || !token) {
      throw new UnauthorizedException('No refresh token.')
    }

    const userId = await this.tokenService.getUserIdFromAccessToken(token)

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(userId, refreshToken)

    res.cookie('refresh_token', newRefreshToken, this.cookieOptions)
    res.json({ access_token: accessToken })
  }
}
