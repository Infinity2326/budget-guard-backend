import * as request from 'supertest'
import TestAgent from 'supertest/lib/agent'
import { App } from 'supertest/types'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { AppModule } from '../../app.module'
import { setupApp } from '../../setup-app'
import { PrismaService } from '../../prisma/prisma.service'
import { RegisterDto } from '../../auth/dto/register.dto'
import { CreateTransaction } from '../dto/create-transaction.dto'
import { CategoryType } from '@prisma/client'
import { UpdateTransaction } from '../dto/update-transaction.dto'
import { GetTransactionsQuery } from '../dto/get-transactions.query.dto'

const incomeId = process.env.DEFAULT_INCOME_ID!
const expenseId = process.env.DEFAULT_EXPENSE_ID!

const defaultCategories = [
  {
    id: incomeId,
    name: 'Default Income',
    type: CategoryType.INCOME,
    description: null,
  },
  {
    id: expenseId,
    name: 'Default Expense',
    type: CategoryType.EXPENSE,
    description: null,
  },
]

const incomeCategory = defaultCategories.find(
  (c) => c.type === CategoryType.INCOME,
)
const expenseCategory = defaultCategories.find(
  (c) => c.type === CategoryType.EXPENSE,
)

const createTransactionDto: CreateTransaction = {
  amount: '1000',
  date: new Date(),
  description: 'breakfast',
  categoryId: expenseId,
}

let updatedTransactionDto: UpdateTransaction
let updatedTransactionId: string

const registerDto: RegisterDto = {
  name: 'testuser2',
  email: 'testuser2@test.com',
  password: 'aB123456!',
  passwordRepeat: 'aB123456!',
}

let accessToken: string
let cookies: string
let userId: string

describe('Transaction controller (e2e)', () => {
  let app: INestApplication<App>
  let agent: TestAgent
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    setupApp(app)
    await app.init()

    prisma = app.get(PrismaService)
    await prisma.category.createMany({
      data: defaultCategories,
      skipDuplicates: true,
    })

    agent = request(app.getHttpServer())

    await register()
  })

  afterAll(async () => {
    await prisma.transaction.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()

    await app.close()
  })

  it('POST /transaction - should create new transaction', async () => {
    const body = await createTransaction(createTransactionDto)

    expect(body).toMatchObject({
      id: expect.any(String) as unknown,
      amount: createTransactionDto.amount,
      date: createTransactionDto.date.toISOString(),
      description: createTransactionDto.description,
      category: {
        ...expenseCategory,
      },
    })

    const dbTransaction = await findTransaction(body.id)

    expect(dbTransaction?.userId).toEqual(userId)

    expect(dbTransaction?.categoryId).toBe(createTransactionDto.categoryId)

    expect(dbTransaction?.amount.toNumber()).toBe(
      Number(createTransactionDto.amount),
    )

    expect(dbTransaction?.date.toISOString()).toBe(
      createTransactionDto.date.toISOString(),
    )

    expect(dbTransaction?.description).toBe(createTransactionDto.description)

    updatedTransactionDto = {
      id: dbTransaction!.id,
      categoryId: incomeId,
      amount: '300000.05',
      date: new Date('2025-01-01T00:00:00Z'),
      description: 'salary',
    }

    updatedTransactionId = dbTransaction!.id
  })

  it('PATCH /transaction - should update existing transaction', async () => {
    const body = await updateTransaction(updatedTransactionDto)

    expect(body).toMatchObject({
      id: expect.any(String) as unknown,
      amount: updatedTransactionDto.amount,
      date: updatedTransactionDto.date?.toISOString(),
      description: updatedTransactionDto.description,
      category: {
        ...incomeCategory,
      },
    })

    const dbTransaction = await findTransaction(body.id)

    expect(dbTransaction?.userId).toEqual(userId)

    expect(dbTransaction?.categoryId).toBe(updatedTransactionDto.categoryId)

    expect(dbTransaction?.amount.toNumber()).toBe(
      Number(updatedTransactionDto.amount),
    )

    expect(dbTransaction?.date.toISOString()).toBe(
      updatedTransactionDto.date?.toISOString(),
    )

    expect(dbTransaction?.description).toBe(updatedTransactionDto.description)
  })

  it('GET /transaction - should return array of transactions', async () => {
    await fillTransactions(createTransactionDto, 10)

    const transactions = await getTransactions()

    const dbTransactions = await prisma.transaction.findMany({
      where: { userId },
    })

    expect(dbTransactions.length).toBe(transactions.length)

    const filteredTransactions = await getTransactions({
      to: '2025-02-01T00:00:00Z',
    })

    expect(filteredTransactions.length).toBe(1)
  })

  it('GET /transaction/:id - should return a transaction by its id', async () => {
    const transaction = await getTransactionById(updatedTransactionId)

    const dbTransaction = await findTransaction(updatedTransactionId)

    expect(transaction).toMatchObject({
      id: dbTransaction!.id,
      amount: dbTransaction!.amount.toString(),
      date: dbTransaction!.date.toISOString(),
      description: dbTransaction!.description,
      category: expect.objectContaining({
        id: dbTransaction!.categoryId,
      }) as TransactionResponse['category'],
    })
  })

  it('DELETE /transaction/:id - should delete a transaction by its id', async () => {
    const transaction = await findTransaction(updatedTransactionId)

    expect(transaction).not.toBeNull()

    await deleteTransactionById(updatedTransactionId)

    const deletedTransaction = await findTransaction(updatedTransactionId)

    expect(deletedTransaction).toBeNull()
  })

  const register = async () => {
    const response = await agent
      .post('/auth/register')
      .send(registerDto)
      .expect(201)
    const body = response.body as RegisterResponseBody
    accessToken = body.access_token

    cookies = response
      .get('Set-Cookie')!
      .map((c) => c.split(';')[0])
      .join('; ')

    const dbUser = await prisma.user.findUnique({
      where: { email: registerDto.email },
    })

    userId = dbUser!.id
  }

  const createTransaction = async (dto: CreateTransaction) => {
    const res = await agent
      .post('/transaction')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .send(dto)
      .expect(201)

    return res.body as TransactionResponse
  }

  const updateTransaction = async (dto: UpdateTransaction) => {
    const res = await agent
      .patch('/transaction')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .send(dto)
      .expect(200)

    return res.body as TransactionResponse
  }

  const getTransactions = async (filters?: GetTransactionsQuery) => {
    if (filters) {
      const res = await agent
        .get('/transaction')
        .query(filters)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookies)
        .expect(200)

      return res.body as TransactionResponse[]
    }

    const res = await agent
      .get('/transaction')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .expect(200)

    return res.body as TransactionResponse[]
  }

  const getTransactionById = async (id: string) => {
    const res = await agent
      .get(`/transaction/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .expect(200)

    return res.body as TransactionResponse
  }

  const deleteTransactionById = async (id: string) => {
    await agent
      .delete(`/transaction/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .expect(204)
  }

  const findTransaction = (id: string) =>
    prisma.transaction.findUnique({ where: { id } })

  const fillTransactions = async (dto: CreateTransaction, count: number) => {
    await Promise.all(
      Array.from({ length: count }).map(() =>
        agent
          .post('/transaction')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Cookie', cookies)
          .send(dto)
          .expect(201),
      ),
    )
  }
})

interface RegisterResponseBody {
  access_token: string
}

interface TransactionResponse {
  id: string
  amount: string
  date: string
  description?: string
  category: {
    id: string
    name: string
    type: string
    description?: string
  }
}
