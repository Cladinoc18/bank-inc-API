import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { CardService } from './card.service';
import { EnrollCardDto } from './dto/enroll-card.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { Card } from './entities/card.entity';
import { ApiKeyGuard } from '../../common/auth/api-key.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { UserRole } from '../../common/auth/roles.enum';

@ApiTags('Cards')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get(':productId/number')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generar número de tarjeta a partir del productId (6 dígitos) [ADMIN]' })
  @ApiParam({ name: 'productId', example: '102030', description: 'Identificador del producto (6 dígitos)' })
  @ApiResponse({ status: 200, description: 'Número de tarjeta generado exitosamente', schema: { example: { cardNumber: '1020301234567801' } } })
  @ApiResponse({ status: 400, description: 'productId no válido' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol ADMIN)' })
  async generateCardNumber(@Param('productId') productId: string) {
    return await this.cardService.generateCardNumber(productId);
  }

  @Post('enroll')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar tarjeta vinculándola a un cliente existente [ADMIN]' })
  @ApiResponse({ status: 200, description: 'Tarjeta asignada y activada exitosamente', type: Card })
  @ApiResponse({ status: 400, description: 'Datos inválidos o tarjeta bloqueada' })
  @ApiResponse({ status: 404, description: 'Tarjeta o Cliente no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol ADMIN)' })
  async enrollCard(@Body() enrollCardDto: EnrollCardDto) {
    return await this.cardService.enrollCard(enrollCardDto);
  }

  @Delete(':cardId')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Bloquear una tarjeta [ADMIN / CLIENT]' })
  @ApiParam({ name: 'cardId', example: '1020301234567801', description: 'Número de la tarjeta a bloquear' })
  @ApiResponse({ status: 200, description: 'Tarjeta bloqueada exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async blockCard(@Param('cardId') cardId: string) {
    return await this.cardService.blockCard(cardId);
  }

  @Post('balance')
  @Roles(UserRole.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recargar saldo a una tarjeta [CLIENT / ADMIN]' })
  @ApiResponse({ status: 200, description: 'Saldo recargado exitosamente' })
  @ApiResponse({ status: 400, description: 'Monto inválido o tarjeta bloqueada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async rechargeBalance(@Body() rechargeBalanceDto: RechargeBalanceDto) {
    return await this.cardService.rechargeBalance(rechargeBalanceDto);
  }

  @Get('balance/:cardId')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Consultar saldo de una tarjeta [CLIENT / ADMIN]' })
  @ApiParam({ name: 'cardId', example: '1020301234567801', description: 'Número de la tarjeta' })
  @ApiResponse({ status: 200, description: 'Consulta de saldo exitosa' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getBalance(@Param('cardId') cardId: string) {
    return await this.cardService.getBalance(cardId);
  }

  @Get(':cardId')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Consultar detalle completo de una tarjeta [ADMIN / CLIENT]' })
  @ApiParam({ name: 'cardId', example: '1020301234567801', description: 'Número de la tarjeta' })
  @ApiResponse({ status: 200, description: 'Detalle de la tarjeta', type: Card })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  async findById(@Param('cardId') cardId: string) {
    return await this.cardService.findById(cardId);
  }
}
