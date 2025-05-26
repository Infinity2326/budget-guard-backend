import { Test, TestingModule } from '@nestjs/testing'
import { TransactionController } from './transaction.controller'
import { TransactionService } from './transaction.service'
import { v4 as uuidv4 } from 'uuid'
import { NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { TokenService } from '../token/token.service'
import { validate, ValidationError } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateTransaction } from './dto/create-transaction.dto'
import { UpdateTransaction } from './dto/update-transaction.dto'
import { GetTransactionsQuery } from './dto/get-transactions.query.dto'

const transactionId = uuidv4()
const categoryId = '00000000-0000-0000-0000-000000000001'
const updatedCategoryId = '00000000-0000-0000-0000-000000000002'
const uuidPlaceholder = '00000000-0000-0000-0000-000000000000'

const userId = uuidv4()

const transaction = {
  id: transactionId,
  amount: '1000.00',
  date: new Date(),
  description: 'test',
  category: {
    id: categoryId,
    name: 'Default Income',
    type: 'INCOME',
    description: null,
  },
}

const updatedTransaction = {
  id: transactionId,
  amount: '5000.00',
  date: new Date(),
  description: 'updated',
  category: {
    id: updatedCategoryId,
    name: 'Default Income',
    type: 'INCOME',
    description: null,
  },
}

const updateTransaction = {
  id: transactionId,
  description: 'updated',
  amount: '5000.00',
  categoryId: updatedCategoryId,
}

const newTransaction = {
  categoryId: categoryId,
  amount: '1000.00',
  date: new Date(),
}

describe('Transaction controller', () => {
  let controller: TransactionController
  let service: jest.Mocked<TransactionService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            createTransaction: jest.fn().mockResolvedValue(transaction),
            updateTransaction: jest.fn().mockResolvedValue(updatedTransaction),
            getTransactions: jest.fn().mockResolvedValue([transaction]),
            getTransactionById: jest.fn().mockResolvedValue(transaction),
            deleteTransaction: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REFRESH_TOKEN_TTL') return 1000 * 60 * 60
              if (key === 'NODE_ENV') return 'test'
              return undefined
            }),
          },
        },
        {
          provide: TokenService,
          useValue: {},
        },
      ],
    }).compile()

    controller = module.get(TransactionController)
    service = module.get(TransactionService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create new transaction', async () => {
    const result = await controller.createTransaction(userId, newTransaction)
    expect(service.createTransaction).toHaveBeenCalledWith(
      userId,
      newTransaction,
    )

    expect(result).toEqual(transaction)
  })

  it('should throw an exception that dont have permission to category', async () => {
    const expectedErrorMessage = 'You dont have access to this category.'

    jest
      .spyOn(service, 'createTransaction')
      .mockRejectedValueOnce(new NotFoundException(expectedErrorMessage))

    const input = { ...newTransaction, categoryId: uuidPlaceholder }

    await expect(() =>
      controller.createTransaction(userId, input),
    ).rejects.toThrow(expectedErrorMessage)

    expect(service.createTransaction).toHaveBeenCalledWith(userId, input)
  })

  it('should update existing transaction', async () => {
    const result = await controller.updateTransaction(userId, updateTransaction)

    expect(service.updateTransaction).toHaveBeenCalledWith(
      userId,
      updateTransaction,
    )

    expect(result).toEqual(updatedTransaction)
  })

  it('should throw an exception that dont have access to this transaction', async () => {
    const expectedErrorMessage = 'You dont have access to this transaction.'

    jest
      .spyOn(service, 'updateTransaction')
      .mockRejectedValueOnce(new NotFoundException(expectedErrorMessage))

    const input = { ...updateTransaction, id: uuidPlaceholder }

    await expect(() =>
      controller.updateTransaction(userId, input),
    ).rejects.toThrow(expectedErrorMessage)

    expect(service.updateTransaction).toHaveBeenCalledWith(userId, input)
  })

  it('should return an array of transactions', async () => {
    const result = await controller.getTransactions(userId, {})

    expect(service.getTransactions).toHaveBeenCalledWith(userId, {})

    expect(result).toEqual([transaction])
  })

  it('should return transaction by its id', async () => {
    const result = await controller.getTransactionById(userId, transactionId)

    expect(service.getTransactionById).toHaveBeenCalledWith(
      userId,
      transactionId,
    )

    expect(result).toEqual(transaction)
  })

  it('should throw an exception that transaction not found', async () => {
    const expectedErrorMessage = 'Transaction not found.'

    jest
      .spyOn(service, 'getTransactionById')
      .mockRejectedValueOnce(new NotFoundException(expectedErrorMessage))

    await expect(() =>
      controller.getTransactionById(userId, uuidPlaceholder),
    ).rejects.toThrow(expectedErrorMessage)

    expect(service.getTransactionById).toHaveBeenCalledWith(
      userId,
      uuidPlaceholder,
    )
  })

  it('should delete transaction by its id', async () => {
    const result = await controller.deleteTransaction(userId, transactionId)

    expect(service.deleteTransaction).toHaveBeenCalledWith(
      userId,
      transactionId,
    )

    expect(result).toEqual(null)
  })

  const expectValidationError = (
    errors: ValidationError[],
    property: string,
  ) => {
    expect(errors.length).toBeGreaterThan(0)
    const error = errors.find((e) => e.property === property)
    expect(error).toBeDefined()
  }

  describe('validation: CreateTransaction dto', () => {
    it('should fail if categoryId is not uuid', async () => {
      const dto = plainToInstance(CreateTransaction, {
        categoryId: '1',
        amount: '2000.00',
        date: new Date(),
      })

      const errors = await validate(dto)
      expectValidationError(errors, 'categoryId')
    })

    it('should fail if no categoryId', async () => {
      const dto = plainToInstance(CreateTransaction, {
        amount: '3000.00',
        date: new Date(),
      })

      const errors = await validate(dto)
      expectValidationError(errors, 'categoryId')
    })

    it('should fail if amount is a string', async () => {
      const dto = plainToInstance(CreateTransaction, {
        categoryId: categoryId,
        amount: 'million',
        date: new Date(),
      })

      const errors = await validate(dto)
      expectValidationError(errors, 'amount')
    })

    it('should fail if date is string', async () => {
      const dto = plainToInstance(CreateTransaction, {
        categoryId: categoryId,
        amount: '1000.00',
        date: '18:00',
      })

      const errors = await validate(dto)
      expectValidationError(errors, 'date')
    })

    it('should pass if dto is valid', async () => {
      const dto = plainToInstance(CreateTransaction, {
        categoryId: categoryId,
        amount: '4000.00',
        date: new Date(),
        description: 'всё нормально',
      })

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('validation: UpdateTransaction dto', () => {
    it('should fail if transaction is not uuid', async () => {
      const dto = plainToInstance(UpdateTransaction, { id: 'not-uuid' })

      const errors = await validate(dto)
      expectValidationError(errors, 'id')
    })

    it('should fail if no id', async () => {
      const dto = plainToInstance(UpdateTransaction, { amount: '100.00' })

      const errors = await validate(dto)
      expectValidationError(errors, 'id')
    })

    it('should fail if amount is a string', async () => {
      const dto = plainToInstance(UpdateTransaction, {
        id: transactionId,
        amount: 'billion',
      })
      const errors = await validate(dto)

      expectValidationError(errors, 'amount')
    })

    it('should fail if date is string', async () => {
      const dto = plainToInstance(CreateTransaction, {
        categoryId: categoryId,
        amount: '1000.00',
        date: '4:20',
      })

      const errors = await validate(dto)
      expectValidationError(errors, 'date')
    })

    it('should pass with valid data', async () => {
      const dto = plainToInstance(UpdateTransaction, {
        id: categoryId,
        amount: '1234.56',
        categoryId: updatedCategoryId,
        date: new Date(),
        description: 'updated value',
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('validation: GetTransactionsQuery dto', () => {
    it('should fail if from or to are not date', async () => {
      let dto = plainToInstance(GetTransactionsQuery, { from: '12.00' })
      let errors = await validate(dto)
      expectValidationError(errors, 'from')

      dto = plainToInstance(GetTransactionsQuery, { to: 'today' })
      errors = await validate(dto)
      expectValidationError(errors, 'to')
    })

    it('should fail if skip or take are not numbers', async () => {
      let dto = plainToInstance(GetTransactionsQuery, { skip: 'zero' })
      let errors = await validate(dto)
      expectValidationError(errors, 'skip')

      dto = plainToInstance(GetTransactionsQuery, { take: 'ten' })
      errors = await validate(dto)
      expectValidationError(errors, 'take')
    })

    it('should pass with valid data', async () => {
      const dto = plainToInstance(GetTransactionsQuery, {
        from: '2025-01-01T00:00:00Z',
        to: new Date(),
        skip: 0,
        take: 50,
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })
})
