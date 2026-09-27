import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Client } from './entities/client.entity';

@ApiTags('Clients')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo cliente en el banco' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente', type: Client })
  @ApiResponse({ status: 400, description: 'Datos de cliente inválidos' })
  @ApiResponse({ status: 409, description: 'Cliente ya existente con ese documento o email' })
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return await this.clientService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los clientes registrados' })
  @ApiResponse({ status: 200, description: 'Listado de clientes', type: [Client] })
  async findAll(): Promise<Client[]> {
    return await this.clientService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar información de un cliente por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del cliente', type: Client })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(@Param('id') id: string): Promise<Client> {
    return await this.clientService.findOne(id);
  }
}
