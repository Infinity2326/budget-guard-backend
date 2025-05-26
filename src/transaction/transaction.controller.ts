import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TransactionService } from './transaction.service'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { SessionGuard } from '../token/guards/session.guard'
import { UpdateTransaction } from './dto/update-transaction.dto'
import { CreateTransaction } from './dto/create-transaction.dto'
import { Authorized } from '../decorators/authorized.decorator'
import { GetTransactionsQuery } from './dto/get-transactions.query.dto'

@Controller('transaction')
@ApiTags('Transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async createTransaction(
    @Authorized('sub') userId: string,
    @Body() dto: CreateTransaction,
  ) {
    return await this.transactionService.createTransaction(userId, dto)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async updateTransaction(
    @Authorized('sub') userId: string,
    @Body() dto: UpdateTransaction,
  ) {
    return await this.transactionService.updateTransaction(userId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async getTransactions(
    @Authorized('sub') userId: string,
    @Query() query: GetTransactionsQuery,
  ) {
    return await this.transactionService.getTransactions(userId, query)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async getTransactionById(
    @Authorized('sub') userId: string,
    @Param('id') id: string,
  ) {
    return await this.transactionService.getTransactionById(userId, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  async deleteTransaction(
    @Authorized('sub') userId: string,
    @Param('id') id: string,
  ) {
    return await this.transactionService.deleteTransaction(userId, id)
  }
}
