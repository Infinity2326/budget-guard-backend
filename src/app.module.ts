import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { TokenModule } from './token/token.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TokenModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
