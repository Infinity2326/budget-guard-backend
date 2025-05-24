import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTransaction } from './dto/create-transaction.dto'
import { UpdateTransaction } from './dto/update-transaction.dto'
import { Prisma } from '@prisma/client'
import { GetTransactionsQueryDto } from './dto/get-transactions.query.dto'

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  public async createTransaction(userId: string, data: CreateTransaction) {
    const exsisting = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null }],
      },
      select: { userId: true },
    })

    if (!exsisting) {
      throw new ForbiddenException('You dont have access to this category.')
    }

    return this.prisma.transaction.create({
      data: {
        ...data,
        userId,
      },
      select: {
        id: true,
        amount: true,
        date: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
      },
    })
  }

  public async updateTransaction(userId: string, dto: UpdateTransaction) {
    const { id, ...data } = dto

    const exsisting = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      select: { userId: true },
    })

    if (!exsisting || exsisting.userId !== userId) {
      throw new ForbiddenException('You dont have access to this transaction.')
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null }],
      },
    })

    if (!category) {
      throw new ForbiddenException('You dont have access to this category.')
    }

    return this.prisma.transaction.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        amount: true,
        date: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
      },
    })
  }

  public async getTransactions(userId: string, query: GetTransactionsQueryDto) {
    const filters: Prisma.TransactionWhereInput = {
      userId,
    }

    if (query.from || query.to) {
      filters.date = {}
      if (query.from) filters.date.gte = new Date(query.from)
      if (query.to) filters.date.lte = new Date(query.to)
    }

    return this.prisma.transaction.findMany({
      where: filters,
      orderBy: {
        date: 'desc',
      },
      skip: query.skip ?? 0,
      take: query.take ?? 50,
      select: {
        id: true,
        amount: true,
        date: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
      },
    })
  }

  public async getTransactionById(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: {
        id: true,
        amount: true,
        date: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
      },
    })

    if (!transaction) {
      throw new NotFoundException('Transaction not found')
    }

    return transaction
  }

  public async deleteTransaction(userId: string, id: string) {
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found')
    }

    await this.prisma.transaction.delete({ where: { id, userId } })
  }
}
