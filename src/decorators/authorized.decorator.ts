import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { TokenPayload } from '../types/auth'
import { Request } from 'express'

export const Authorized = createParamDecorator(
  (
    data: keyof TokenPayload,
    ctx: ExecutionContext,
  ): TokenPayload[keyof TokenPayload] | TokenPayload => {
    const request: Request = ctx.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new UnauthorizedException('Unauthorized')
    }

    return data ? user[data] : user
  },
)
