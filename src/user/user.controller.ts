import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { UserService } from './user.service'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { UpdateUserDto } from './dto/update-user.dto'
import { SessionGuard } from '../token/guards/session.guard'
import { Authorized } from '../decorators/authorized.decorator'

@Controller('user')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async getUser(@Authorized('sub') userId: string) {
    return await this.userService.getUserById(userId)
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async updateUser(
    @Authorized('sub') userId: string,
    dto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(userId, dto)
  }

  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async deleteUser(@Authorized('sub') userId: string) {
    return await this.userService.deleteUser(userId)
  }
}
