import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import IORedis from 'ioredis'

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const password = config.getOrThrow<string>('REDIS_PASSWORD')
        const host = config.getOrThrow<string>('REDIS_HOST')
        const port = config.getOrThrow<string>('REDIS_PORT')
        const redisUri = `redis://:${password}@${host}:${port}`
        return new IORedis(redisUri)
      },
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
