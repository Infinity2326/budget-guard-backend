import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTransaction } from './dto/create-transaction.dto'
import { UpdateTransaction } from './dto/update-transaction.dto'
import { Prisma } from '@prisma/client'
import { GetTransactionsQuery } from './dto/get-transactions.query.dto'

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  transactionSelect = {
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
  }

  public async createTransaction(userId: string, data: CreateTransaction) {
    const existing = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null }],
      },
      select: { userId: true },
    })

    if (!existing) {
      throw new ForbiddenException('You dont have access to this category.')
    }

    return this.prisma.transaction.create({
      data: {
        ...data,
        userId,
      },
      select: this.transactionSelect,
    })
  }

  public async updateTransaction(userId: string, dto: UpdateTransaction) {
    const { id, ...data } = dto

    const existing = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      select: { userId: true },
    })

    if (!existing || existing.userId !== userId) {
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
      select: this.transactionSelect,
    })
  }

  public async getTransactions(userId: string, query: GetTransactionsQuery) {
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
      select: this.transactionSelect,
    })
  }

  public async getTransactionById(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: this.transactionSelect,
    })

    if (!transaction) {
      throw new NotFoundException('Transaction not found.')
    }

    return transaction
  }

  public async deleteTransaction(userId: string, id: string) {
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found.')
    }

    await this.prisma.transaction.delete({ where: { id, userId } })
  }
}
