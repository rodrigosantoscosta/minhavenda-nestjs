import { Inject, Injectable } from '@nestjs/common';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class BuscarPedidoQuery {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async executar(
    usuarioId: string,
    pedidoId: string,
  ): Promise<PedidoDetalhadoDto> {
    const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);

    // Ownership check — return 404 rather than 403 to avoid revealing existence
    if (pedido.usuario.id !== usuarioId) {
      throw new ResourceNotFoundException(`Pedido não encontrado: ${pedidoId}`);
    }

    return PedidoMapper.toDetalhadoDto(pedido);
  }
}
