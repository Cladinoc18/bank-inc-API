import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class EnrollCardDto {
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
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del cliente registrado en la base de datos al que se le asignará la tarjeta',
  })
  @IsString({ message: 'El clientId debe ser un texto' })
  @IsNotEmpty({ message: 'El clientId es obligatorio para asignar la tarjeta y activarla' })
  clientId: string;

  @ApiProperty({
    example: '1234',
    description: 'PIN de seguridad de 4 dígitos numéricos para compras (opcional, por defecto: "1234")',
    required: false,
    default: '1234',
  })
  @IsOptional()
  @IsString({ message: 'El PIN debe ser un texto de 4 dígitos' })
  @Length(4, 4, { message: 'El PIN debe contener exactamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN debe contener únicamente dígitos numéricos' })
  pin?: string;
}
