import { forwardRef, Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UserModule } from '../user/user.module'
import { TokenModule } from '../token/token.module'
import { LocalGuard } from './guards/local.guard'
import { LocalStrategy } from './strategy/local.strategy'

@Module({
  imports: [forwardRef(() => UserModule), TokenModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, LocalGuard],
  exports: [AuthService],
})
export class AuthModule {}
