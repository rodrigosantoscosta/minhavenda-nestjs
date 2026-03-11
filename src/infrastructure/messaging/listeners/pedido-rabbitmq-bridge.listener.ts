import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PedidoCriadoEvent } from '@domain/events/pedido-criado.event';
import { PedidoPagoEvent } from '@domain/events/pedido-pago.event';
import { PedidoEnviadoEvent } from '@domain/events/pedido-enviado.event';
import { PedidoCanceladoEvent } from '@domain/events/pedido-cancelado.event';
import { PedidoRabbitMQProducer } from '../producer/pedido-rabbitmq.producer';

/**
 * Bridges in-process domain events → RabbitMQ.
 * The producer is optional-injected so MessagingModule can still boot
 * without RabbitMQModule in test environments.
 */
@Injectable()
export class PedidoRabbitMQBridgeListener {
  private readonly logger = new Logger(PedidoRabbitMQBridgeListener.name);

  constructor(@Optional() private readonly producer: PedidoRabbitMQProducer) {}

  @OnEvent('PedidoCriadoEvent', { async: true })
  async handlePedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.publicarPedidoCriado(event);
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ bridge] PedidoCriado [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoPagoEvent', { async: true })
  async handlePedidoPago(event: PedidoPagoEvent): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.publicarPedidoPago(event);
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ bridge] PedidoPago [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoEnviadoEvent', { async: true })
  async handlePedidoEnviado(event: PedidoEnviadoEvent): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.publicarPedidoEnviado(event);
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ bridge] PedidoEnviado [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoCanceladoEvent', { async: true })
  async handlePedidoCancelado(event: PedidoCanceladoEvent): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.publicarPedidoCancelado(event);
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ bridge] PedidoCancelado [${event.pedidoId}]`,
        err,
      );
    }
  }
}
