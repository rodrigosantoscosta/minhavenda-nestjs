import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { EnviarPedidoDto } from '@app/dtos/pedido/enviar-pedido.dto';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class EnviarPedidoUseCase {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async executar(
    pedidoId: string,
    dto: EnviarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);

    pedido.marcarComoEnviado(dto.codigoRastreio, dto.transportadora);

    const events = pedido.consumeEvents();
    const saved = await this.pedidoRepo.save(pedido);

    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return PedidoMapper.toDetalhadoDto(saved);
  }
}
