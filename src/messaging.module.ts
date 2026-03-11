import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Notificacao } from '@domain/entities/notificacao.entity';
import { INOTIFICACAO_REPOSITORY } from '@domain/repositories/inotificacao.repository';
import { NotificacaoTypeOrmRepository } from '@infra/persistence/repositories/notificacao.typeorm.repository';
import { PedidoEmailService } from '@infra/messaging/pedido-email.service';
import { PedidoEmailListener } from '@infra/messaging/listeners/pedido-email.listener';
import { PedidoNotificationListener } from '@infra/messaging/listeners/pedido-notification.listener';
import { PedidoRabbitMQBridgeListener } from '@infra/messaging/listeners/pedido-rabbitmq-bridge.listener';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacao]),

    // MailerModule — configured from env, pointing at Mailhog in dev
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow<string>('MAIL_HOST'),
          port: config.getOrThrow<number>('MAIL_PORT'),
          secure: false,
          ignoreTLS: true,
        },
        defaults: {
          from: `"${config.getOrThrow<string>('MAIL_FROM_NAME')}" <${config.getOrThrow<string>('MAIL_FROM')}>`,
        },
      }),
    }),

    // Provides IUSUARIO_REPOSITORY (needed by PedidoNotificationListener)
    AuthModule,
  ],
  providers: [
    {
      provide: INOTIFICACAO_REPOSITORY,
      useClass: NotificacaoTypeOrmRepository,
    },

    PedidoEmailService,

    // 3 independent listeners
    PedidoEmailListener,
    PedidoNotificationListener,
    PedidoRabbitMQBridgeListener,
  ],
  exports: [INOTIFICACAO_REPOSITORY, PedidoEmailService],
})
export class MessagingModule {}
