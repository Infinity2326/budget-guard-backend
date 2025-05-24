import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CategoryService } from './category.service'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Authorized } from '../decorators/authorized.decorator'
import { SessionGuard } from '../token/guards/session.guard'
import { CreateCategory } from './dto/create-category.dto'
import { UpdateCategory } from './dto/update-category.dto'

@Controller('category')
@ApiTags('Categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async createCategory(
    @Authorized('sub') userId: string,
    @Body() dto: CreateCategory,
  ) {
    return await this.categoryService.createCategory(userId, dto)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  public async updateCategory(
    @Authorized('sub') userId: string,
    @Body() dto: UpdateCategory,
  ) {
    return await this.categoryService.updateCategory(userId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async getCategories(@Authorized('sub') userId: string) {
    return await this.categoryService.getCategories(userId)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async getCategoryById(
    @Authorized('sub') userId: string,
    @Param('id') id: string,
  ) {
    return await this.categoryService.getCategoryById(userId, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async deleteCategory(
    @Authorized('sub') userId: string,
    @Param('id') id: string,
  ) {
    return await this.categoryService.deleteCategory(userId, id)
  }
}
