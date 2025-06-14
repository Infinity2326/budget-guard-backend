import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { TokenService } from '../token.service'
import { TokenPayload } from '../../types/auth'

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest()

    const accessToken = this.extractTokenFromHeader(request)
    const refreshToken = request.cookies?.['refresh_token'] as string

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException(
        `No ${!refreshToken && !accessToken ? 'access and refresh' : ''}${!accessToken ? 'access' : 'refresh'} token provided.`,
      )
    }

    let userId: string

    try {
      const payload: TokenPayload = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
        },
      )

      userId = payload.sub
      request['user'] = payload
    } catch {
      throw new UnauthorizedException('Invalid token.')
    }

    const exists = await this.tokenService.validateRefreshToken(
      userId,
      refreshToken,
    )

    if (!exists) {
      throw new UnauthorizedException('Refresh session invalid or expired')
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, accessToken] = request.headers.authorization?.split(' ') ?? []

    return type === 'Bearer' ? accessToken : undefined
  }
}
