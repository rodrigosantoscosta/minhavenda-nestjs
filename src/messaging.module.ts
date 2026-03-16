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

    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') !== 'production';
        const password = config.get<string>('MAIL_PASSWORD');

        return {
          transport: {
            host: config.getOrThrow<string>('MAIL_HOST'),
            port: config.getOrThrow<number>('MAIL_PORT'),
            // Dev (Mailhog): no TLS, no auth
            // Prod (Resend/SMTP): STARTTLS on 587, auth required
            secure: false,
            ignoreTLS: isDev,
            ...(isDev || !password
              ? {}
              : {
                  auth: {
                    user: 'resend',   // Resend SMTP user is always "resend"
                    pass: password,
                  },
                }),
          },
          defaults: {
            from: `"${config.getOrThrow<string>('MAIL_FROM_NAME')}" <${config.getOrThrow<string>('MAIL_FROM')}>`,
          },
        };
      },
    }),

    AuthModule,
  ],
  providers: [
    {
      provide: INOTIFICACAO_REPOSITORY,
      useClass: NotificacaoTypeOrmRepository,
    },

    PedidoEmailService,

    PedidoEmailListener,
    PedidoNotificationListener,
    PedidoRabbitMQBridgeListener,
  ],
  exports: [INOTIFICACAO_REPOSITORY, PedidoEmailService],
})
export class MessagingModule {}
