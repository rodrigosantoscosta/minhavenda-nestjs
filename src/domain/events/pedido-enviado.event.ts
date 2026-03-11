import { BaseDomainEvent } from './base-domain.event';

export interface PedidoEnviadoEventProps {
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  nomeUsuario: string;
  codigoRastreio: string;
  transportadora: string;
  telefone: string;
}

export class PedidoEnviadoEvent extends BaseDomainEvent {
  readonly pedidoId: string;
  readonly usuarioId: string;
  readonly emailUsuario: string;
  readonly nomeUsuario: string;
  readonly codigoRastreio: string;
  readonly transportadora: string;
  readonly telefone: string;

  constructor(props: PedidoEnviadoEventProps) {
    super('PedidoEnviadoEvent');
    this.pedidoId = props.pedidoId;
    this.usuarioId = props.usuarioId;
    this.emailUsuario = props.emailUsuario;
    this.nomeUsuario = props.nomeUsuario;
    this.codigoRastreio = props.codigoRastreio;
    this.transportadora = props.transportadora;
    this.telefone = props.telefone;
  }
}
