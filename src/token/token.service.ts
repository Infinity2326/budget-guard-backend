import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { hash, verify } from 'argon2'
import { randomUUID } from 'crypto'
import IORedis from 'ioredis'
import { TokenPayload } from '../types/auth'

@Injectable()
export class TokenService {
  private readonly ttl: number
  private readonly jwtSecret: string

  constructor(
    @Inject('REDIS') private readonly redis: IORedis,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.ttl =
      this.config.get<number>('REFRESH_TOKEN_TTL') || 1000 * 60 * 60 * 24 * 30

    this.jwtSecret = this.config.getOrThrow('JWT_SECRET')
  }

  public getRedisKey(userId: string): string {
    const prefix = this.config.get<string>('REDIS_KEY_PREFIX') || 'refresh'
    return `${prefix}:${userId}`
  }

  public async getUserIdFromAccessToken(token: string) {
    try {
      const payload: TokenPayload = await this.jwt.verifyAsync(token, {
        secret: this.jwtSecret,
        ignoreExpiration: true,
      })

      return payload.sub
    } catch {
      throw new UnauthorizedException('Invalid access token')
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID()
    const hashedToken = await hash(token)

    const key = this.getRedisKey(userId)
    await this.redis.set(key, hashedToken, 'EX', this.ttl)

    return token
  }

  public async generateAccessToken(userId: string): Promise<string> {
    const jti = randomUUID()

    const payload = { sub: userId, jti }

    return this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.jwtSecret,
    })
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const key = this.getRedisKey(userId)
    const storedHash = await this.redis.get(key)

    if (!storedHash) return false

    return verify(storedHash, token)
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    const key = this.getRedisKey(userId)

    await this.redis.del(key)
  }

  async rotateRefreshToken(userId: string, oldToken: string): Promise<string> {
    const isValid = await this.validateRefreshToken(userId, oldToken)

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token.')
    }

    await this.deleteRefreshToken(userId)

    return this.generateRefreshToken(userId)
  }

  public async revokeToken(userId: string): Promise<void> {
    await this.deleteRefreshToken(userId)
  }
}
