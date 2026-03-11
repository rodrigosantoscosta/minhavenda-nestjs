/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { SseRegistry } from '@infra/sse/sse.registry';
import { PedidoCriadoMessage } from '../dto/pedido-criado.message';
import { PedidoPagoMessage } from '../dto/pedido-pago.message';
import { PedidoEnviadoMessage } from '../dto/pedido-enviado.message';
import { PedidoCanceladoMessage } from '../dto/pedido-cancelado.message';
import {
  PEDIDOS_EXCHANGE,
  QUEUE_PEDIDO_CRIADO,
  QUEUE_PEDIDO_PAGO,
  QUEUE_PEDIDO_ENVIADO,
  QUEUE_PEDIDO_CANCELADO,
  RK_PEDIDO_CRIADO,
  RK_PEDIDO_PAGO,
  RK_PEDIDO_ENVIADO,
  RK_PEDIDO_CANCELADO,
} from '../rabbitmq.constants';

@Injectable()
export class PedidoRabbitMQConsumer {
  private readonly logger = new Logger(PedidoRabbitMQConsumer.name);

  constructor(private readonly sseRegistry: SseRegistry) {}

  // ── Pedido Criado ──────────────────────────────────────────────────────────

  @RabbitSubscribe({
    exchange: PEDIDOS_EXCHANGE,
    routingKey: RK_PEDIDO_CRIADO,
    queue: QUEUE_PEDIDO_CRIADO,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'pedidos.dlx',
        'x-dead-letter-routing-key': 'pedidos.criado.dlq',
      },
    },
  })
  async onPedidoCriado(message: PedidoCriadoMessage): Promise<void | Nack> {
    this.logger.log(
      `📥 [RabbitMQ] PedidoCriado recebido — pedidoId: ${message.pedidoId} | total: R$ ${message.valorTotal}`,
    );
    try {
      this.sseRegistry.sendEvent(message.usuarioId, 'pedido.criado', message);
      this.logger.log(
        `✅ [RabbitMQ] PedidoCriado processado — pedidoId: ${message.pedidoId}`,
      );
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ] Erro ao processar PedidoCriado — pedidoId: ${message.pedidoId}`,
        err,
      );
      return new Nack(false); // dead-letter, do not requeue
    }
  }

  // ── Pedido Pago ────────────────────────────────────────────────────────────

  @RabbitSubscribe({
    exchange: PEDIDOS_EXCHANGE,
    routingKey: RK_PEDIDO_PAGO,
    queue: QUEUE_PEDIDO_PAGO,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'pedidos.dlx',
        'x-dead-letter-routing-key': 'pedidos.pago.dlq',
      },
    },
  })
  async onPedidoPago(message: PedidoPagoMessage): Promise<void | Nack> {
    this.logger.log(
      `📥 [RabbitMQ] PedidoPago recebido — pedidoId: ${message.pedidoId} | método: ${message.metodoPagamento}`,
    );
    try {
      this.sseRegistry.sendEvent(message.usuarioId, 'pedido.pago', message);
      this.logger.log(
        `✅ [RabbitMQ] PedidoPago processado — pedidoId: ${message.pedidoId}`,
      );
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ] Erro ao processar PedidoPago — pedidoId: ${message.pedidoId}`,
        err,
      );
      return new Nack(false);
    }
  }

  // ── Pedido Enviado ─────────────────────────────────────────────────────────

  @RabbitSubscribe({
    exchange: PEDIDOS_EXCHANGE,
    routingKey: RK_PEDIDO_ENVIADO,
    queue: QUEUE_PEDIDO_ENVIADO,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'pedidos.dlx',
        'x-dead-letter-routing-key': 'pedidos.enviado.dlq',
      },
    },
  })
  async onPedidoEnviado(message: PedidoEnviadoMessage): Promise<void | Nack> {
    this.logger.log(
      `📥 [RabbitMQ] PedidoEnviado recebido — pedidoId: ${message.pedidoId} | rastreio: ${message.codigoRastreio}`,
    );
    try {
      this.sseRegistry.sendEvent(message.usuarioId, 'pedido.enviado', message);
      this.logger.log(
        `✅ [RabbitMQ] PedidoEnviado processado — pedidoId: ${message.pedidoId}`,
      );
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ] Erro ao processar PedidoEnviado — pedidoId: ${message.pedidoId}`,
        err,
      );
      return new Nack(false);
    }
  }

  // ── Pedido Cancelado ───────────────────────────────────────────────────────

  @RabbitSubscribe({
    exchange: PEDIDOS_EXCHANGE,
    routingKey: RK_PEDIDO_CANCELADO,
    queue: QUEUE_PEDIDO_CANCELADO,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'pedidos.dlx',
        'x-dead-letter-routing-key': 'pedidos.cancelado.dlq',
      },
    },
  })
  async onPedidoCancelado(
    message: PedidoCanceladoMessage,
  ): Promise<void | Nack> {
    this.logger.log(
      `📥 [RabbitMQ] PedidoCancelado recebido — pedidoId: ${message.pedidoId} | motivo: ${message.motivo}`,
    );
    try {
      this.sseRegistry.sendEvent(
        message.usuarioId,
        'pedido.cancelado',
        message,
      );
      this.logger.log(
        `✅ [RabbitMQ] PedidoCancelado processado — pedidoId: ${message.pedidoId}`,
      );
    } catch (err) {
      this.logger.error(
        `❌ [RabbitMQ] Erro ao processar PedidoCancelado — pedidoId: ${message.pedidoId}`,
        err,
      );
      return new Nack(false);
    }
  }
}
