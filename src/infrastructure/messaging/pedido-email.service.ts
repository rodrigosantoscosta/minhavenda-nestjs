import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class PedidoEmailService {
  private readonly logger = new Logger(PedidoEmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  // ── Pedido Criado ──────────────────────────────────────────────────────────

  async enviarEmailPedidoCriado(
    destinatario: string,
    nomeUsuario: string,
    pedidoId: string,
    valorTotal: number,
    quantidadeItens: number,
  ): Promise<void> {
    this.logger.log(`📧 Enviando email de pedido criado para: ${destinatario}`);

    const shortId = pedidoId.substring(0, 8);
    const assunto = `✅ Pedido #${shortId} criado com sucesso!`;

    const corpo = [
      `Olá ${nomeUsuario},`,
      '',
      'Seu pedido foi criado com sucesso!',
      '',
      `📦 Número do Pedido: ${shortId}`,
      `💰 Valor Total: R$ ${valorTotal.toFixed(2)}`,
      `📊 Quantidade de Itens: ${quantidadeItens}`,
      '',
      'Aguardamos a confirmação do pagamento para processar seu pedido.',
      '',
      'Obrigado por comprar conosco!',
      '',
      'Atenciosamente,',
      'Equipe MinhaVenda',
    ].join('\n');

    await this.mailerService.sendMail({
      to: destinatario,
      subject: assunto,
      text: corpo,
    });
    this.logger.log(`✅ Email de pedido criado enviado para: ${destinatario}`);
  }

  // ── Pedido Pago ────────────────────────────────────────────────────────────

  async enviarEmailPedidoPago(
    destinatario: string,
    pedidoId: string,
    valorPago: number,
    metodoPagamento: string,
  ): Promise<void> {
    this.logger.log(`📧 Enviando email de pedido pago para: ${destinatario}`);

    const shortId = pedidoId.substring(0, 8);
    const assunto = `💳 Pagamento confirmado - Pedido #${shortId}`;

    const corpo = [
      'Olá,',
      '',
      'Seu pagamento foi confirmado!',
      '',
      `📦 Número do Pedido: ${shortId}`,
      `💰 Valor Pago: R$ ${valorPago.toFixed(2)}`,
      `💳 Método de Pagamento: ${metodoPagamento}`,
      '',
      'Seu pedido está sendo preparado para envio.',
      'Você receberá um email com o código de rastreio em breve.',
      '',
      'Obrigado pela sua compra!',
      '',
      'Atenciosamente,',
      'Equipe MinhaVenda',
    ].join('\n');

    await this.mailerService.sendMail({
      to: destinatario,
      subject: assunto,
      text: corpo,
    });
    this.logger.log(`✅ Email de pedido pago enviado para: ${destinatario}`);
  }

  // ── Pedido Enviado ─────────────────────────────────────────────────────────

  async enviarEmailPedidoEnviado(
    destinatario: string,
    nomeUsuario: string,
    pedidoId: string,
    codigoRastreio: string,
    transportadora: string,
    telefone: string,
  ): Promise<void> {
    this.logger.log(
      `📧 Enviando email de pedido enviado para: ${destinatario}`,
    );

    const shortId = pedidoId.substring(0, 8);
    const assunto = `🚚 Pedido enviado - #${shortId}`;

    const telefoneInfo =
      telefone && telefone !== 'Não informado'
        ? `\n📱 Telefone de Contato: ${telefone}`
        : '';

    const corpo = [
      `Olá ${nomeUsuario},`,
      '',
      'Seu pedido foi enviado!',
      '',
      `📦 Número do Pedido: ${shortId}`,
      `🚚 Transportadora: ${transportadora}`,
      `📍 Código de Rastreio: ${codigoRastreio}${telefoneInfo}`,
      '',
      'Você pode acompanhar sua entrega através do código de rastreio acima.',
      'Em breve seu pedido chegará ao destino!',
      '',
      'Obrigado pela preferência!',
      '',
      'Atenciosamente,',
      'Equipe MinhaVenda',
    ].join('\n');

    await this.mailerService.sendMail({
      to: destinatario,
      subject: assunto,
      text: corpo,
    });
    this.logger.log(
      `✅ Email de pedido enviado para: ${destinatario} — Rastreio: ${codigoRastreio}`,
    );
  }

  // ── Pedido Cancelado ───────────────────────────────────────────────────────

  async enviarEmailPedidoCancelado(
    destinatario: string,
    pedidoId: string,
    motivo: string,
  ): Promise<void> {
    this.logger.log(
      `📧 Enviando email de pedido cancelado para: ${destinatario}`,
    );

    const shortId = pedidoId.substring(0, 8);
    const assunto = `❌ Pedido cancelado - #${shortId}`;

    const corpo = [
      'Olá,',
      '',
      'Informamos que seu pedido foi cancelado.',
      '',
      `📦 Número do Pedido: ${shortId}`,
      `📝 Motivo do Cancelamento: ${motivo}`,
      '',
      'Se você tiver alguma dúvida ou não solicitou este cancelamento,',
      'entre em contato conosco imediatamente.',
      '',
      'Esperamos atendê-lo novamente em breve!',
      '',
      'Atenciosamente,',
      'Equipe MinhaVenda',
    ].join('\n');

    await this.mailerService.sendMail({
      to: destinatario,
      subject: assunto,
      text: corpo,
    });
    this.logger.log(
      `✅ Email de pedido cancelado enviado para: ${destinatario}`,
    );
  }
}
