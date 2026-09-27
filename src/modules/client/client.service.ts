import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService implements OnModuleInit {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async onModuleInit() {
    await this.seedInitialClients();
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existing = await this.clientRepository.findOne({
      where: [
        { documentNumber: createClientDto.documentNumber },
        { email: createClientDto.email },
      ],
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un cliente registrado con ese número de documento o correo electrónico',
      );
    }

    const client = this.clientRepository.create(createClientDto);
    return await this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return await this.clientRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['cards'],
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return client;
  }

  async seedInitialClients(): Promise<void> {
    try {
      const count = await this.clientRepository.count();
      if (count === 0) {
        this.logger.log('Inicializando clientes semilla para pruebas...');
        const initialClient = this.clientRepository.create({
          firstName: 'Juan',
          lastName: 'Pérez',
          documentNumber: '1020304050',
          email: 'juan.perez@bankinc.com',
        });
        await this.clientRepository.save(initialClient);
        this.logger.log(`Cliente inicial creado: ${initialClient.id} (Juan Pérez)`);
      }
    } catch (error) {
      this.logger.warn(`No se pudo ejecutar el seeder inicial: ${error.message}`);
    }
  }
}
