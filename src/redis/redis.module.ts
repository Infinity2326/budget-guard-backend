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
        return new IORedis(config.getOrThrow<string>('REDIS_URI'))
      },
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
