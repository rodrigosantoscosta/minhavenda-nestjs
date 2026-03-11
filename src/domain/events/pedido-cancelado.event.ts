import { BaseDomainEvent } from './base-domain.event';

export interface PedidoCanceladoEventProps {
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  motivo: string;
}

export class PedidoCanceladoEvent extends BaseDomainEvent {
  readonly pedidoId: string;
  readonly usuarioId: string;
  readonly emailUsuario: string;
  readonly motivo: string;

  constructor(props: PedidoCanceladoEventProps) {
    super('PedidoCanceladoEvent');
    this.pedidoId = props.pedidoId;
    this.usuarioId = props.usuarioId;
    this.emailUsuario = props.emailUsuario;
    this.motivo = props.motivo;
  }
}
