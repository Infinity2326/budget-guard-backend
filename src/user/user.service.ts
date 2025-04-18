import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { Prisma } from '@prisma/client'
import { hash } from 'argon2'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  public async createUser(data: Prisma.UserCreateInput) {
    const hashedPassword = await this.hashPassword(data.password)

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    })
  }

  public async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      throw new NotFoundException()
    }

    return user
  }

  public async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    return user
  }

  public async updateUser(id: string, data: UpdateUserDto) {
    const user = await this.getUserById(id)

    if (!user) {
      throw new NotFoundException()
    }

    return this.prisma.user.update({ where: { id }, data })
  }

  public async deleteUser(id: string) {
    const user = await this.getUserById(id)

    if (!user) {
      throw new NotFoundException()
    }

    return this.prisma.user.delete({ where: { id } })
  }

  private async hashPassword(password: string) {
    if (!password) {
      throw new Error('Password is required.')
    }

    return await hash(password)
  }
}
