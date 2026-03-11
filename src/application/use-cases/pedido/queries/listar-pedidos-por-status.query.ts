import { Inject, Injectable } from '@nestjs/common';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import { PedidoDto } from '@app/dtos/pedido/pedido.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class ListarPedidosPorStatusQuery {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async executar(status: StatusPedido): Promise<PedidoDto[]> {
    const pedidos = await this.pedidoRepo.findByStatus(status);
    return pedidos.map((p) => PedidoMapper.toDto(p));
  }
}
