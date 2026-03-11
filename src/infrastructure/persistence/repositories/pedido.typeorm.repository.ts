import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '@domain/entities/pedido.entity';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import {
  assertPedidoFound,
  IPedidoRepository,
} from '@domain/repositories/ipedido.repository';

/** Relations always loaded to ensure domain methods, mappers and @AfterLoad work correctly. */
const RELATIONS = ['usuario', 'itens', 'itens.produto'];

@Injectable()
export class PedidoTypeOrmRepository implements IPedidoRepository {
  constructor(
    @InjectRepository(Pedido)
    private readonly repo: Repository<Pedido>,
  ) {}

  async findById(id: string): Promise<Pedido | null> {
    return this.repo.findOne({ where: { id }, relations: RELATIONS });
  }

  async findByIdOrThrow(id: string): Promise<Pedido> {
    const pedido = await this.findById(id);
    return assertPedidoFound(pedido, id);
  }

  async findByUsuarioId(usuarioId: string): Promise<Pedido[]> {
    return this.repo.find({
      where: { usuario: { id: usuarioId } },
      relations: RELATIONS,
      order: { dataCriacao: 'DESC' },
    });
  }

  async findAll(): Promise<Pedido[]> {
    return this.repo.find({
      relations: RELATIONS,
      order: { dataCriacao: 'DESC' },
    });
  }

  async findByStatus(status: StatusPedido): Promise<Pedido[]> {
    return this.repo.find({
      where: { status },
      relations: RELATIONS,
      order: { dataCriacao: 'DESC' },
    });
  }

  async save(pedido: Pedido): Promise<Pedido> {
    const saved = await this.repo.save(pedido);
    // Reload with full relations so callers always receive a fully populated entity
    return this.findByIdOrThrow(saved.id);
  }
}
