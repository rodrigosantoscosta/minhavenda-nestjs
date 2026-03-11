import { BaseDomainEvent } from './base-domain.event';

export interface PedidoPagoEventProps {
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  valorPago: number;
  metodoPagamento: string;
}

export class PedidoPagoEvent extends BaseDomainEvent {
  readonly pedidoId: string;
  readonly usuarioId: string;
  readonly emailUsuario: string;
  readonly valorPago: number;
  readonly metodoPagamento: string;

  constructor(props: PedidoPagoEventProps) {
    super('PedidoPagoEvent');
    this.pedidoId = props.pedidoId;
    this.usuarioId = props.usuarioId;
    this.emailUsuario = props.emailUsuario;
    this.valorPago = props.valorPago;
    this.metodoPagamento = props.metodoPagamento;
  }
}
