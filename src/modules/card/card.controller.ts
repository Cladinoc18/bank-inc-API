import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CardService } from './card.service';
import { EnrollCardDto } from './dto/enroll-card.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { Card } from './entities/card.entity';

@ApiTags('Cards')
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get(':productId/number')
  @ApiOperation({ summary: 'Generar número de tarjeta a partir del productId (6 dígitos)' })
  @ApiParam({ name: 'productId', example: '102030', description: 'Identificador del producto (6 dígitos)' })
  @ApiResponse({ status: 200, description: 'Número de tarjeta generado exitosamente', schema: { example: { cardNumber: '1020301234567801' } } })
  @ApiResponse({ status: 400, description: 'productId no válido' })
  async generateCardNumber(@Param('productId') productId: string) {
    return await this.cardService.generateCardNumber(productId);
  }

  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar tarjeta vinculándola a un cliente existente' })
  @ApiResponse({ status: 200, description: 'Tarjeta asignada y activada exitosamente', type: Card })
  @ApiResponse({ status: 400, description: 'Datos inválidos o tarjeta bloqueada' })
  @ApiResponse({ status: 404, description: 'Tarjeta o Cliente no encontrado' })
  async enrollCard(@Body() enrollCardDto: EnrollCardDto) {
    return await this.cardService.enrollCard(enrollCardDto);
  }

  @Delete(':cardId')
  @ApiOperation({ summary: 'Bloquear una tarjeta' })
  @ApiParam({ name: 'cardId', example: '1020301234567801', description: 'Número de la tarjeta a bloquear' })
  @ApiResponse({ status: 200, description: 'Tarjeta bloqueada exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  async blockCard(@Param('cardId') cardId: string) {
    return await this.cardService.blockCard(cardId);
  }

  @Post('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recargar saldo a una tarjeta' })
  @ApiResponse({ status: 200, description: 'Saldo recargado exitosamente' })
  @ApiResponse({ status: 400, description: 'Monto inválido o tarjeta bloqueada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  async rechargeBalance(@Body() rechargeBalanceDto: RechargeBalanceDto) {
    return await this.cardService.rechargeBalance(rechargeBalanceDto);
  }

  @Get('balance/:cardId')
  @ApiOperation({ summary: 'Consultar saldo de una tarjeta' })
  @ApiParam({ name: 'cardId', example: '1020301234567801', description: 'Número de la tarjeta' })
  @ApiResponse({ status: 200, description: 'Consulta de saldo exitosa' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  async getBalance(@Param('cardId') cardId: string) {
    return await this.cardService.getBalance(cardId);
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Consultar detalle completo de una tarjeta' })
  @ApiParam({ name: 'cardId', example: '1020301234567801', description: 'Número de la tarjeta' })
  @ApiResponse({ status: 200, description: 'Detalle de la tarjeta', type: Card })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  async findById(@Param('cardId') cardId: string) {
    return await this.cardService.findById(cardId);
  }
}
