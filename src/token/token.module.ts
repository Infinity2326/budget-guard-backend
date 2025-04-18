import { Module } from '@nestjs/common'
import { TokenService } from './token.service'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SessionGuard } from './guards/session.guard'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TokenService, SessionGuard],
  exports: [TokenService, JwtModule, SessionGuard],
})
export class TokenModule {}
