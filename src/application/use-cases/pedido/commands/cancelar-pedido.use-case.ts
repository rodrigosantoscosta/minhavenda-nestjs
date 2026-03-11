import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { CancelarPedidoDto } from '@app/dtos/pedido/cancelar-pedido.dto';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class CancelarPedidoUseCase {
  constructor(
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async executar(
    usuarioId: string,
    pedidoId: string,
    dto: CancelarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);

    // Ownership check — return 404 rather than 403 to avoid revealing existence
    if (pedido.usuario.id !== usuarioId) {
      throw new ResourceNotFoundException(`Pedido não encontrado: ${pedidoId}`);
    }

    pedido.cancelar(dto.motivo);

    const events = pedido.consumeEvents();
    const saved = await this.pedidoRepo.save(pedido);

    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return PedidoMapper.toDetalhadoDto(saved);
  }
}
