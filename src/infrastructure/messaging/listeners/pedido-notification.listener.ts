import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedidoCriadoEvent } from '@domain/events/pedido-criado.event';
import { PedidoPagoEvent } from '@domain/events/pedido-pago.event';
import { PedidoEnviadoEvent } from '@domain/events/pedido-enviado.event';
import { PedidoCanceladoEvent } from '@domain/events/pedido-cancelado.event';
import { Notificacao } from '@domain/entities/notificacao.entity';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';

@Injectable()
export class PedidoNotificationListener {
  private readonly logger = new Logger(PedidoNotificationListener.name);

  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepo: Repository<Notificacao>,
    @Inject(IUSUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
  ) {}

  private async salvarNotificacao(
    usuarioId: string,
    mensagem: string,
  ): Promise<void> {
    const usuario = await this.usuarioRepo.findByIdOrThrow(usuarioId);
    const notificacao = new Notificacao({
      usuario,
      tipo: 'EMAIL',
      mensagem,
      enviado: true,
      enviadoEm: new Date(),
    });
    await this.notificacaoRepo.save(notificacao);
  }

  @OnEvent('PedidoCriadoEvent', { async: true })
  async handlePedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    try {
      const mensagem = `✅ Pedido Criado — Seu pedido #${event.pedidoId.substring(0, 8)} foi criado com sucesso! Total: R$ ${event.valorTotal.toFixed(2)}`;
      await this.salvarNotificacao(event.usuarioId, mensagem);
    } catch (err) {
      this.logger.error(
        `❌ Falha ao criar notificação PedidoCriado [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoPagoEvent', { async: true })
  async handlePedidoPago(event: PedidoPagoEvent): Promise<void> {
    try {
      const mensagem = `💰 Pagamento Confirmado — Pagamento do pedido #${event.pedidoId.substring(0, 8)} confirmado via ${event.metodoPagamento}! Valor: R$ ${event.valorPago.toFixed(2)}`;
      await this.salvarNotificacao(event.usuarioId, mensagem);
    } catch (err) {
      this.logger.error(
        `❌ Falha ao criar notificação PedidoPago [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoEnviadoEvent', { async: true })
  async handlePedidoEnviado(event: PedidoEnviadoEvent): Promise<void> {
    try {
      const mensagem = `📦 Pedido Enviado — Seu pedido #${event.pedidoId.substring(0, 8)} foi enviado via ${event.transportadora}! Código de rastreio: ${event.codigoRastreio}`;
      await this.salvarNotificacao(event.usuarioId, mensagem);
    } catch (err) {
      this.logger.error(
        `❌ Falha ao criar notificação PedidoEnviado [${event.pedidoId}]`,
        err,
      );
    }
  }

  @OnEvent('PedidoCanceladoEvent', { async: true })
  async handlePedidoCancelado(event: PedidoCanceladoEvent): Promise<void> {
    try {
      const mensagem = `❌ Pedido Cancelado — Pedido #${event.pedidoId.substring(0, 8)} foi cancelado. Motivo: ${event.motivo}`;
      await this.salvarNotificacao(event.usuarioId, mensagem);
    } catch (err) {
      this.logger.error(
        `❌ Falha ao criar notificação PedidoCancelado [${event.pedidoId}]`,
        err,
      );
    }
  }
}
