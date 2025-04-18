import { Module } from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { TransactionController } from './transaction.controller'
import { TokenModule } from '../token/token.module'

@Module({
  controllers: [TransactionController],
  providers: [TransactionService],
  imports: [TokenModule],
})
export class TransactionModule {}
