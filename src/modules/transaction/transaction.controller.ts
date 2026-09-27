import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { AnulateTransactionDto } from './dto/anulate-transaction.dto';
import { Transaction } from './entities/transaction.entity';

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar una transacción de compra con la tarjeta' })
  @ApiResponse({
    status: 200,
    description: 'Compra realizada exitosamente',
    schema: {
      example: {
        transactionId: '102030',
        cardId: '1020301234567801',
        price: 100,
        status: 'APPROVED',
        createdAt: '2026-09-27T16:00:00.000Z',
        remainingBalance: 9900,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente, tarjeta inactiva, bloqueada o vencida' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  async purchase(@Body() purchaseTransactionDto: PurchaseTransactionDto) {
    return await this.transactionService.purchase(purchaseTransactionDto);
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Consultar detalle de una transacción por ID' })
  @ApiParam({ name: 'transactionId', example: '102030', description: 'Identificador único de la transacción' })
  @ApiResponse({ status: 200, description: 'Detalle de la transacción', type: Transaction })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async findById(@Param('transactionId') transactionId: string) {
    return await this.transactionService.findById(transactionId);
  }

  @Post('anulation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular una transacción de compra dentro de las 24 horas y reintegrar el saldo' })
  @ApiResponse({
    status: 200,
    description: 'Transacción anulada y saldo reintegrado exitosamente',
    schema: {
      example: {
        message: 'Transacción anulada exitosamente',
        transactionId: '102030',
        cardId: '1020301234567801',
        refundedAmount: 100,
        newBalance: 10000,
        status: 'ANNULLED',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Límite de 24h superado, transacción ya anulada o tarjeta no coincide' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async anulate(@Body() anulateTransactionDto: AnulateTransactionDto) {
    return await this.transactionService.anulate(anulateTransactionDto);
  }
}
