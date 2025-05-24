import { ConfigService } from '@nestjs/config'
import { CookieOptions } from 'express'

export const getRefreshTokenCookieOptions = (
  config: ConfigService,
): CookieOptions => {
  const ttl =
    config.get<number>('REFRESH_TOKEN_TTL') || 1000 * 60 * 60 * 24 * 30

  return {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'lax',
    maxAge: ttl,
  }
}
