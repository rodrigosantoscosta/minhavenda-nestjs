import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  PEDIDOS_EXCHANGE,
  DLQ_PEDIDO_CRIADO,
  DLQ_PEDIDO_PAGO,
  DLQ_PEDIDO_ENVIADO,
  DLQ_PEDIDO_CANCELADO,
  RK_PEDIDO_CRIADO,
  RK_PEDIDO_PAGO,
  RK_PEDIDO_ENVIADO,
  RK_PEDIDO_CANCELADO,
} from './rabbitmq.constants';

const DLQ_TO_ROUTING_KEY: Record<string, string> = {
  [DLQ_PEDIDO_CRIADO]: RK_PEDIDO_CRIADO,
  [DLQ_PEDIDO_PAGO]: RK_PEDIDO_PAGO,
  [DLQ_PEDIDO_ENVIADO]: RK_PEDIDO_ENVIADO,
  [DLQ_PEDIDO_CANCELADO]: RK_PEDIDO_CANCELADO,
};

export const VALID_DLQS = Object.keys(DLQ_TO_ROUTING_KEY);

@Injectable()
export class DlqRequeueService {
  private readonly logger = new Logger(DlqRequeueService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Drains one DLQ and republishes every message to pedidos.exchange.
   * Uses channel.get() in a loop until the queue is empty (returns false).
   * Returns the number of messages requeued.
   */
  async requeue(dlqName: string): Promise<number> {
    const routingKey = DLQ_TO_ROUTING_KEY[dlqName];
    if (!routingKey) {
      throw new Error(
        `DLQ desconhecida: ${dlqName}. DLQs válidas: ${VALID_DLQS.join(', ')}`,
      );
    }

    this.logger.log(
      `[DLQ] Iniciando requeue: ${dlqName} → exchange: ${PEDIDOS_EXCHANGE} | rk: ${routingKey}`,
    );

    const channel = this.amqpConnection.channel;
    let count = 0;

    while (true) {
      const msg = await channel.get(dlqName, { noAck: false });
      if (msg === false) break; // queue empty

      try {
        channel.publish(
          PEDIDOS_EXCHANGE,
          routingKey,
          msg.content,
          msg.properties,
        );
        channel.ack(msg);
        count++;
        this.logger.debug(
          `[DLQ] Mensagem reenfileirada de ${dlqName} → rk '${routingKey}'`,
        );
      } catch (err) {
        channel.nack(msg, false, true); // put back in DLQ
        this.logger.error(
          `[DLQ] Falha ao reenviar mensagem de ${dlqName}`,
          err,
        );
      }
    }

    this.logger.log(
      `[DLQ] Requeue concluído — ${dlqName} | reenfileiradas: ${count}`,
    );
    return count;
  }

  /**
   * Drains all DLQs in sequence.
   * Returns a map of dlqName → count.
   */
  async requeueAll(): Promise<Record<string, number>> {
    this.logger.log('[DLQ] Iniciando requeue de todas as DLQs...');
    const resultado: Record<string, number> = {};

    for (const dlqName of VALID_DLQS) {
      resultado[dlqName] = await this.requeue(dlqName);
    }

    const total = Object.values(resultado).reduce((s, n) => s + n, 0);
    this.logger.log(
      `[DLQ] Requeue total concluído — ${total} mensagens em ${VALID_DLQS.length} DLQs`,
    );
    return resultado;
  }
}
