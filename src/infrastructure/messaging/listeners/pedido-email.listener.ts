import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PedidoCriadoEvent } from '@domain/events/pedido-criado.event';
import { PedidoPagoEvent } from '@domain/events/pedido-pago.event';
import { PedidoEnviadoEvent } from '@domain/events/pedido-enviado.event';
import { PedidoCanceladoEvent } from '@domain/events/pedido-cancelado.event';
import { PedidoEmailService } from '../pedido-email.service';

@Injectable()
export class PedidoEmailListener {
  private readonly logger = new Logger(PedidoEmailListener.name);

  constructor(private readonly emailService: PedidoEmailService) {}

  @OnEvent('PedidoCriadoEvent', { async: true })
  async handlePedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    try {
      await this.emailService.enviarEmailPedidoCriado(
        event.emailUsuario,
        event.nomeUsuario,
        event.pedidoId,
        event.valorTotal,
        event.quantidadeItens,
      );
    } catch (err) {
      this.logger.error(
        `❌ Falha ao enviar email PedidoCriado [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoPagoEvent', { async: true })
  async handlePedidoPago(event: PedidoPagoEvent): Promise<void> {
    try {
      await this.emailService.enviarEmailPedidoPago(
        event.emailUsuario,
        event.pedidoId,
        event.valorPago,
        event.metodoPagamento,
      );
    } catch (err) {
      this.logger.error(
        `❌ Falha ao enviar email PedidoPago [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoEnviadoEvent', { async: true })
  async handlePedidoEnviado(event: PedidoEnviadoEvent): Promise<void> {
    try {
      await this.emailService.enviarEmailPedidoEnviado(
        event.emailUsuario,
        event.nomeUsuario,
        event.pedidoId,
        event.codigoRastreio,
        event.transportadora,
        event.telefone,
      );
    } catch (err) {
      this.logger.error(
        `❌ Falha ao enviar email PedidoEnviado [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoCanceladoEvent', { async: true })
  async handlePedidoCancelado(event: PedidoCanceladoEvent): Promise<void> {
    try {
      await this.emailService.enviarEmailPedidoCancelado(
        event.emailUsuario,
        event.pedidoId,
        event.motivo,
      );
    } catch (err) {
      this.logger.error(
        `❌ Falha ao enviar email PedidoCancelado [${event.pedidoId}]`,
        err,
      );
    }
  }
}
