import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';

export class PurchaseTransactionDto {
  @ApiProperty({
    example: '1020301234567801',
    description: 'Número de tarjeta de 16 dígitos',
  })
  @IsString({ message: 'El cardId debe ser un texto' })
  @IsNotEmpty({ message: 'El cardId es obligatorio' })
  @Length(16, 16, { message: 'El cardId debe contener exactamente 16 dígitos' })
  @Matches(/^\d{16}$/, { message: 'El cardId debe ser una cadena de 16 dígitos numéricos' })
  cardId: string;

  @ApiProperty({
    example: 100,
    description: 'Monto de la compra en dólares (USD)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido' })
  @IsPositive({ message: 'El precio de compra debe ser un valor positivo mayor a cero' })
  price: number;

  @ApiProperty({
    example: '1234',
    description: 'PIN de seguridad de 4 dígitos de la tarjeta',
    required: false,
    default: '1234',
  })
  @IsOptional()
  @IsString({ message: 'El PIN debe ser un texto de 4 dígitos' })
  @Length(4, 4, { message: 'El PIN debe contener exactamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN debe contener únicamente dígitos numéricos' })
  pin?: string;
}
