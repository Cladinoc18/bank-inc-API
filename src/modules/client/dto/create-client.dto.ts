import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Juan', description: 'Primer nombre del cliente' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(2, 100)
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Length(2, 100)
  lastName: string;

  @ApiProperty({ example: '1098765432', description: 'Número de documento de identidad' })
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @Length(5, 20)
  documentNumber: string;

  @ApiProperty({ example: 'juan.perez@example.com', description: 'Correo electrónico del cliente' })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;
}
