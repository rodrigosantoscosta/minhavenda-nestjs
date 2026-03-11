import { Inject, Injectable } from '@nestjs/common';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class BuscarPedidoAdminQuery {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
  ) {}

  /** Admin lookup — no ownership check. */
  async executar(pedidoId: string): Promise<PedidoDetalhadoDto> {
    const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);
    return PedidoMapper.toDetalhadoDto(pedido);
  }
}
