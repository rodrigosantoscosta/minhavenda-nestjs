import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PedidoCriadoEvent } from '@domain/events/pedido-criado.event';
import { PedidoPagoEvent } from '@domain/events/pedido-pago.event';
import { PedidoEnviadoEvent } from '@domain/events/pedido-enviado.event';
import { PedidoCanceladoEvent } from '@domain/events/pedido-cancelado.event';
import { PedidoCriadoMessage } from '../dto/pedido-criado.message';
import { PedidoPagoMessage } from '../dto/pedido-pago.message';
import { PedidoEnviadoMessage } from '../dto/pedido-enviado.message';
import { PedidoCanceladoMessage } from '../dto/pedido-cancelado.message';
import {
  PEDIDOS_EXCHANGE,
  RK_PEDIDO_CRIADO,
  RK_PEDIDO_PAGO,
  RK_PEDIDO_ENVIADO,
  RK_PEDIDO_CANCELADO,
} from '../rabbitmq.constants';

@Injectable()
export class PedidoRabbitMQProducer {
  private readonly logger = new Logger(PedidoRabbitMQProducer.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publicarPedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    const message: PedidoCriadoMessage = {
      eventId: event.eventId,
      pedidoId: event.pedidoId,
      usuarioId: event.usuarioId,
      emailUsuario: event.emailUsuario,
      nomeUsuario: event.nomeUsuario,
      valorTotal: event.valorTotal,
      quantidadeItens: event.quantidadeItens,
      ocorridoEm: event.occurredOn.toISOString(),
    };
    await this.publicar(
      RK_PEDIDO_CRIADO,
      message,
      'PedidoCriado',
      event.pedidoId,
    );
  }

  async publicarPedidoPago(event: PedidoPagoEvent): Promise<void> {
    const message: PedidoPagoMessage = {
      eventId: event.eventId,
      pedidoId: event.pedidoId,
      usuarioId: event.usuarioId,
      emailUsuario: event.emailUsuario,
      valorPago: event.valorPago,
      metodoPagamento: event.metodoPagamento,
      ocorridoEm: event.occurredOn.toISOString(),
    };
    await this.publicar(RK_PEDIDO_PAGO, message, 'PedidoPago', event.pedidoId);
  }

  async publicarPedidoEnviado(event: PedidoEnviadoEvent): Promise<void> {
    const message: PedidoEnviadoMessage = {
      eventId: event.eventId,
      pedidoId: event.pedidoId,
      usuarioId: event.usuarioId,
      nomeUsuario: event.nomeUsuario,
      emailUsuario: event.emailUsuario,
      telefone: event.telefone,
      codigoRastreio: event.codigoRastreio,
      transportadora: event.transportadora,
      ocorridoEm: event.occurredOn.toISOString(),
    };
    await this.publicar(
      RK_PEDIDO_ENVIADO,
      message,
      'PedidoEnviado',
      event.pedidoId,
    );
  }

  async publicarPedidoCancelado(event: PedidoCanceladoEvent): Promise<void> {
    const message: PedidoCanceladoMessage = {
      eventId: event.eventId,
      pedidoId: event.pedidoId,
      usuarioId: event.usuarioId,
      emailUsuario: event.emailUsuario,
      motivo: event.motivo,
      ocorridoEm: event.occurredOn.toISOString(),
    };
    await this.publicar(
      RK_PEDIDO_CANCELADO,
      message,
      'PedidoCancelado',
      event.pedidoId,
    );
  }

  private async publicar(
    routingKey: string,
    message: object,
    tipoEvento: string,
    pedidoId: string,
  ): Promise<void> {
    try {
      await this.amqpConnection.publish(PEDIDOS_EXCHANGE, routingKey, message);
      this.logger.log(
        `📤 [RabbitMQ] ${tipoEvento} publicado — pedidoId: ${pedidoId} | rk: ${routingKey}`,
      );
    } catch (err) {
      // Swallow: RabbitMQ failures must not break the email/notification flow
      this.logger.error(
        `❌ [RabbitMQ] Falha ao publicar ${tipoEvento} — pedidoId: ${pedidoId}`,
        err,
      );
    }
  }
}
