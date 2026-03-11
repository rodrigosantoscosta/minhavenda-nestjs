import { Module } from '@nestjs/common';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { SseRegistry } from '@infra/sse/sse.registry';
import { PedidoRabbitMQProducer } from '@infra/messaging/producer/pedido-rabbitmq.producer';
import { PedidoRabbitMQConsumer } from '@infra/messaging/consumer/pedido-rabbitmq.consumer';
import { DlqRequeueService } from '@infra/messaging/dlq-requeue.service';
import { DlqAdminController } from '@presentation/controllers/dlq-admin.controller';
import {
  PEDIDOS_EXCHANGE,
  PEDIDOS_DLX,
  DLQ_PEDIDO_CRIADO,
  DLQ_PEDIDO_PAGO,
  DLQ_PEDIDO_ENVIADO,
  DLQ_PEDIDO_CANCELADO,
} from '@infra/messaging/rabbitmq.constants';

@Module({
  imports: [
    GolevelupRabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('RABBITMQ_URL'),
        exchanges: [
          { name: PEDIDOS_EXCHANGE, type: 'topic', options: { durable: true } },
          { name: PEDIDOS_DLX, type: 'direct', options: { durable: true } },
        ],
        queues: [
          // Dead-letter queues — plain durable, no further DLX
          { name: DLQ_PEDIDO_CRIADO, options: { durable: true } },
          { name: DLQ_PEDIDO_PAGO, options: { durable: true } },
          { name: DLQ_PEDIDO_ENVIADO, options: { durable: true } },
          { name: DLQ_PEDIDO_CANCELADO, options: { durable: true } },
        ],
        // Business queues + DLX args are declared via @RabbitSubscribe queueOptions
        connectionInitOptions: { wait: false }, // don't block startup if RabbitMQ is down
      }),
    }),
  ],
  controllers: [DlqAdminController],
  providers: [
    SseRegistry,
    PedidoRabbitMQProducer,
    PedidoRabbitMQConsumer,
    DlqRequeueService,
  ],
  exports: [SseRegistry, PedidoRabbitMQProducer],
})
export class RabbitMQModule {}
