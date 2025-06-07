import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

const incomeId = process.env.DEFAULT_INCOME_ID!
const expenseId = process.env.DEFAULT_EXPENSE_ID!

async function main() {
  await prisma.category.createMany({
    data: [
      {
        id: incomeId,
        name: 'Default Income',
        type: 'INCOME',
      },
      {
        id: expenseId,
        name: 'Default Expense',
        type: 'EXPENSE',
      },
    ],
    skipDuplicates: true,
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
