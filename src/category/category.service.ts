import { UpdateCategory } from './dto/update-category.dto'
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategory } from './dto/create-category.dto'

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  public async createCategory(userId: string, data: CreateCategory) {
    return this.prisma.category.create({
      data: {
        ...data,
        userId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
    })
  }

  public async updateCategory(userId: string, dto: UpdateCategory) {
    const { id, ...data } = dto

    const exstisting = await this.prisma.category.findFirst({
      where: {
        id,
        userId,
      },
      select: { userId: true },
    })

    if (!exstisting || exstisting.userId !== userId) {
      throw new ForbiddenException('You dont have access to this category.')
    }

    return this.prisma.category.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
    })
  }

  public async getCategories(userId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
    })
  }

  public async getCategoryById(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, OR: [{ userId }, { userId: null }] },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
    })

    if (!category) {
      throw new NotFoundException('Category not found/')
    }

    return category
  }

  public async deleteCategory(userId: string, id: string) {
    const existingCategory = await this.prisma.category.findFirst({
      where: { id, userId },
    })

    if (!existingCategory) {
      throw new NotFoundException('Category not found.')
    }

    await this.prisma.category.delete({ where: { id, userId } })
  }
}
