import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Length, Matches } from 'class-validator';

export class RechargeBalanceDto {
  @ApiProperty({
    example: '1020301234567801',
    description: 'Número de tarjeta de 16 dígitos',
  })
  @IsString({ message: 'El cardId debe ser un texto numérico' })
  @IsNotEmpty({ message: 'El cardId es obligatorio' })
  @Length(16, 16, { message: 'El cardId debe contener exactamente 16 dígitos' })
  @Matches(/^\d{16}$/, { message: 'El cardId debe ser una cadena de 16 dígitos numéricos' })
  cardId: string;

  @ApiProperty({
    example: '10000',
    description: 'Monto a recargar en dólares (USD)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El balance debe ser un número válido' })
  @IsPositive({ message: 'El monto de recarga debe ser positivo mayor a cero' })
  balance: number;
}
