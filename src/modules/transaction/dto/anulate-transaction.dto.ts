import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class AnulateTransactionDto {
  @ApiProperty({
    example: '1020301234567801',
    description: 'Número de tarjeta con la que se realizó la compra',
  })
  @IsString({ message: 'El cardId debe ser un texto' })
  @IsNotEmpty({ message: 'El cardId es obligatorio' })
  @Length(16, 16, { message: 'El cardId debe contener exactamente 16 dígitos' })
  @Matches(/^\d{16}$/, { message: 'El cardId debe ser una cadena de 16 dígitos numéricos' })
  cardId: string;

  @ApiProperty({
    example: '102030',
    description: 'Identificador único de la transacción a anular',
  })
  @IsString({ message: 'El transactionId debe ser un texto' })
  @IsNotEmpty({ message: 'El transactionId es obligatorio' })
  transactionId: string;
}
