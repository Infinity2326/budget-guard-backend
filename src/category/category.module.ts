import { Module } from '@nestjs/common'
import { CategoryService } from './category.service'
import { CategoryController } from './category.controller'
import { TokenModule } from '../token/token.module'

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [TokenModule],
})
export class CategoryModule {}
