import { Pedido } from '../entities/pedido.entity';
import { StatusPedido } from '../enums/status-pedido.enum';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const IPEDIDO_REPOSITORY = Symbol('IPedidoRepository');

export interface IPedidoRepository {
  findById(id: string): Promise<Pedido | null>;

  findByIdOrThrow(id: string): Promise<Pedido>;

  /** Client: list orders belonging to a specific user */
  findByUsuarioId(usuarioId: string): Promise<Pedido[]>;

  /** Admin: list all orders regardless of owner */
  findAll(): Promise<Pedido[]>;

  /** Admin: list orders filtered by status */
  findByStatus(status: StatusPedido): Promise<Pedido[]>;

  save(pedido: Pedido): Promise<Pedido>;
}

export function assertPedidoFound(pedido: Pedido | null, id: string): Pedido {
  if (!pedido) {
    throw new ResourceNotFoundException(`Pedido não encontrado: ${id}`);
  }

  return pedido;
}
