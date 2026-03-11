import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { PagarPedidoDto } from '@app/dtos/pedido/pagar-pedido.dto';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class PagarPedidoAdminUseCase {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Admin payment — no ownership check. */
  async executar(
    pedidoId: string,
    dto: PagarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);

    pedido.marcarComoPago(
      dto.metodoPagamento,
      dto.valorPago ?? Number(pedido.valorTotal),
    );

    const events = pedido.consumeEvents();
    const saved = await this.pedidoRepo.save(pedido);

    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return PedidoMapper.toDetalhadoDto(saved);
  }
}
