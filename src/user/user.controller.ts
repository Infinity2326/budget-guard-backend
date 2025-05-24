import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { UserService } from './user.service'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { UpdateUserDto } from './dto/update-user.dto'
import { SessionGuard } from '../token/guards/session.guard'
import { Authorized } from '../decorators/authorized.decorator'
import { Request, Response } from 'express'
import { AuthService } from '../auth/auth.service'
import { ConfigService } from '@nestjs/config'
import { getRefreshTokenCookieOptions } from '../common/cookie-options'

@Controller('user')
@ApiTags('Users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}
  cookieOptions = getRefreshTokenCookieOptions(this.config)

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async getUserById(@Authorized('sub') userId: string) {
    return await this.userService.getUserById(userId)
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async updateUser(
    @Authorized('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(userId, dto)
  }

  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async deleteUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Authorized('sub') userId: string,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string

    await this.authService.logout(userId, refreshToken)
    await this.userService.deleteUser(userId)

    res.clearCookie('refresh_token', this.cookieOptions)
  }
}
