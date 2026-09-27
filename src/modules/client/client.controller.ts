import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Client } from './entities/client.entity';
import { ApiKeyGuard } from '../../common/auth/api-key.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { UserRole } from '../../common/auth/roles.enum';

@ApiTags('Clients')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un nuevo cliente en el banco [ADMIN]' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente', type: Client })
  @ApiResponse({ status: 400, description: 'Datos de cliente inválidos' })
  @ApiResponse({ status: 409, description: 'Cliente ya existente con ese documento o email' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return await this.clientService.create(createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los clientes registrados [ADMIN]' })
  @ApiResponse({ status: 200, description: 'Listado de clientes', type: [Client] })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  async findAll(): Promise<Client[]> {
    return await this.clientService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar información de un cliente por ID [ADMIN]' })
  @ApiResponse({ status: 200, description: 'Detalle del cliente', type: Client })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado / Falta x-api-key' })
  async findOne(@Param('id') id: string): Promise<Client> {
    return await this.clientService.findOne(id);
  }
}
