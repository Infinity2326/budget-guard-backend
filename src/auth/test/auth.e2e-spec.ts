import IORedis from 'ioredis'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { App } from 'supertest/types'
import { PrismaService } from '../../prisma/prisma.service'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../app.module'
import { ConfigService } from '@nestjs/config'
import * as request from 'supertest'
import { RegisterDto } from '../dto/register.dto'
import { LoginDto } from '../dto/login.dto'
import { TokenService } from '../../token/token.service'
import { JwtService } from '@nestjs/jwt'
import { TokenPayload } from '../../types/auth'
import * as cookieParser from 'cookie-parser'

const registerDto: RegisterDto = {
  name: 'testuser',
  email: 'testuser@test.com',
  password: 'aB123456!',
  passwordRepeat: 'aB123456!',
}

const loginDto: LoginDto = {
  email: 'testuser@test.com',
  password: 'aB123456!',
}

describe('Auth controller (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService
  let redis: IORedis
  let tokenService: TokenService
  let jwtService: JwtService
  let configService: ConfigService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    const config = app.get(ConfigService)
    app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      }),
    )

    app.enableCors({
      origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
      credentials: true,
      exposedHeaders: ['Set-Cookie'],
    })

    await app.init()

    prisma = app.get(PrismaService)
    redis = app.get('REDIS')
    tokenService = app.get(TokenService)
    jwtService = app.get(JwtService)
    configService = app.get(ConfigService)
  })

  afterAll(async () => {
    await prisma.user.deleteMany()

    await redis.flushdb()
    await redis.quit()

    await app.close()
  })

  it('POST /auth/register - should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201)

    await verifyAuth(response, registerDto)
  })

  it('POST /auth/login - should return access token & set refresh token in cookies', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)
    await verifyAuth(response, loginDto)
  })

  it('POST /auth/refresh - should return new access token & refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)

    const {
      response: loginResponse,
      refreshToken: oldRefreshToken,
      accessToken: oldAccessToken,
    } = await verifyAuth(response, loginDto)

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${oldAccessToken}`)
      .set('Cookie', extractCookies(loginResponse.get('Set-Cookie')!))
      .expect(200)

    const { refreshToken: newRefreshToken, accessToken: newAccessToken } =
      await verifyAuth(refreshResponse, loginDto)

    expect(newAccessToken).not.toBe(oldAccessToken)
    expect(newRefreshToken).not.toBe(oldRefreshToken)

    const oldPayload: TokenPayload = await jwtService.verifyAsync(
      oldAccessToken,
      {
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      },
    )
    const newPayload: TokenPayload = await jwtService.verifyAsync(
      newAccessToken,
      {
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      },
    )

    expect(oldPayload.sub).toBe(newPayload.sub)
    expect(oldPayload.jti).not.toBe(newPayload.jti)
  })

  it('POST /auth/logout - should remove access token & refresh token & return message', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)

    const { response: loginResponse, accessToken } = await verifyAuth(
      response,
      loginDto,
    )

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', extractCookies(loginResponse.get('Set-Cookie')!))
      .expect(204)

    const cookies = logoutResponse.get('Set-Cookie')
    const refreshCookie = cookies?.find((c: string) =>
      c.startsWith('refresh_token='),
    )

    expect(refreshCookie).toContain('Expires=Thu, 01 Jan 1970')
    expect(refreshCookie).toContain('HttpOnly')
  })

  const verifyAuth = async (
    response: request.Response,
    dto: LoginDto | RegisterDto,
  ) => {
    const body = response.body as ResponseBody
    expect(body).toHaveProperty('access_token')

    const accessToken = body.access_token
    expect(accessToken.length).toBeGreaterThan(100)

    const tokenPayload: TokenPayload = await jwtService.verifyAsync(
      accessToken,
      {
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      },
    )

    const user = await prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    })
    expect(user).toBeTruthy()
    expect(tokenPayload.sub).toBe(user!.id)

    const cookies = response.get('Set-Cookie')
    expect(
      cookies?.some((c: string) => {
        return c.startsWith('refresh_token=')
      }),
    ).toBe(true)

    expect(
      cookies?.find((c: string) => c.startsWith('refresh_token=')),
    ).toMatch(/refresh_token=.*HttpOnly/)

    const refreshToken = getRefreshToken(cookies)

    expect(refreshToken).toBeDefined()

    const isValidRefresh = await tokenService.validateRefreshToken(
      user!.id,
      refreshToken!,
    )

    expect(isValidRefresh).toBe(true)

    return { response, refreshToken, accessToken }
  }

  const getRefreshToken = (cookies: string[] | undefined) => {
    return cookies
      ?.find((c: string) => c.startsWith('refresh_token='))
      ?.split(';')[0]
      .split('=')[1]
  }

  const extractCookies = (cookies: string[]) =>
    cookies.map((c) => c.split(';')[0]).join('; ')
})

interface ResponseBody {
  access_token: string
}
