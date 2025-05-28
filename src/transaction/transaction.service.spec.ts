import { v4 as uuidv4 } from 'uuid'
import { TransactionService } from './transaction.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTransaction } from './dto/create-transaction.dto'
import { Test, TestingModule } from '@nestjs/testing'

const userId = uuidv4()

const category = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Default Income',
  type: 'INCOME',
  description: null,
}

const uuidPlaceholder = '00000000-0000-0000-0000-000000000000'
const transactionId = uuidv4()

const transactions = [
  {
    id: transactionId,
    amount: '12000.00',
    date: new Date(),
    description: 'food',
    category,
  },
  {
    id: uuidv4(),
    amount: '300000.00',
    date: new Date(),
    description: 'alco',
    category: {
      id: uuidv4(),
      name: 'salary',
      type: 'INCOME',
      description: 'salary',
    },
  },
  {
    id: uuidv4(),
    amount: '3000.00',
    date: new Date(),
    description: '',
    category: {
      id: uuidv4(),
      name: 'transport',
      type: 'EXPENSE',
      description: 'gasoline, taxi',
    },
  },
]

const transaction = transactions[0]

const updatedTransaction = {
  id: transactionId,
  amount: '1000.00',
  date: new Date(),
  categoryId: uuidv4(),
  description: 'updated',
}

const createTransaction: CreateTransaction = {
  amount: '4000.00',
  date: new Date(),
  categoryId: uuidv4(),
}

const db = {
  transaction: {
    findFirst: jest.fn().mockResolvedValue(transaction),
    findMany: jest.fn().mockResolvedValue(transactions),
    create: jest.fn().mockResolvedValue(transaction),
    update: jest.fn().mockResolvedValue(updatedTransaction),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  category: {
    findFirst: jest.fn().mockResolvedValue(category),
  },
}

describe('Transaction service', () => {
  let service: jest.Mocked<TransactionService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile()

    service = module.get(TransactionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return an array of users transactions', async () => {
    const result = await service.getTransactions(userId, {})

    expect(result).toEqual(transactions)
  })

  it('should return users transaction by its id', async () => {
    const result = await service.getTransactionById(userId, transactionId)

    expect(result).toEqual(transaction)
  })

  it('should throw NotFoundException if transaction not found by id', async () => {
    db.transaction.findFirst.mockResolvedValueOnce(null)

    const result = service.getTransactionById(userId, uuidPlaceholder)

    await expect(result).rejects.toThrow('Transaction not found.')
  })

  it('should create new transaction', async () => {
    const result = await service.createTransaction(userId, createTransaction)

    expect(result).toEqual(transaction)
  })

  it('should throw ForbiddenException if user has no access to category', async () => {
    db.category.findFirst.mockResolvedValueOnce(null)

    const result = service.createTransaction(userId, createTransaction)

    await expect(result).rejects.toThrow(
      'You dont have access to this category.',
    )
  })

  it('should update a transaction', async () => {
    db.transaction.findFirst.mockResolvedValueOnce({ userId })

    const result = await service.updateTransaction(userId, transaction)

    expect(result).toEqual(updatedTransaction)
  })

  it('should throw ForbiddenException if user has no access to transaction', async () => {
    db.transaction.findFirst.mockResolvedValueOnce(null)

    const result = service.updateTransaction(userId, {
      ...updatedTransaction,
      id: uuidPlaceholder,
    })

    await expect(result).rejects.toThrow(
      'You dont have access to this transaction.',
    )
  })

  it('should throw ForbiddenException if user has no access to category', async () => {
    db.transaction.findFirst.mockResolvedValueOnce({ userId })
    db.category.findFirst.mockResolvedValueOnce(null)

    const result = service.updateTransaction(userId, {
      ...updatedTransaction,
      categoryId: uuidPlaceholder,
    })

    await expect(result).rejects.toThrow(
      'You dont have access to this category.',
    )
  })

  it('should delete a transaction', async () => {
    db.transaction.findFirst.mockResolvedValueOnce({
      id: transactionId,
      userId,
    })
    const spy = jest.spyOn(db.transaction, 'delete')

    const result = service.deleteTransaction(userId, transactionId)

    await expect(result).resolves.toBeUndefined()

    expect(spy).toHaveBeenCalledWith({
      where: { id: transactionId, userId },
    })
  })

  it('should throw NotFoundException if transaction not found for delete', async () => {
    db.transaction.findFirst.mockResolvedValueOnce(null)

    const result = service.deleteTransaction(userId, uuidPlaceholder)

    await expect(result).rejects.toThrow('Transaction not found.')
  })
})
