import { Inject, Injectable } from '@nestjs/common';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class EntregarPedidoUseCase {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async executar(pedidoId: string): Promise<PedidoDetalhadoDto> {
    const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);

    pedido.marcarComoEntregue();

    const saved = await this.pedidoRepo.save(pedido);
    return PedidoMapper.toDetalhadoDto(saved);
  }
}
