import { BaseDomainEvent } from './base-domain.event';

export interface PedidoCriadoEventProps {
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  nomeUsuario: string;
  valorTotal: number;
  quantidadeItens: number;
}

export class PedidoCriadoEvent extends BaseDomainEvent {
  readonly pedidoId: string;
  readonly usuarioId: string;
  readonly emailUsuario: string;
  readonly nomeUsuario: string;
  readonly valorTotal: number;
  readonly quantidadeItens: number;

  constructor(props: PedidoCriadoEventProps) {
    super('PedidoCriadoEvent');
    this.pedidoId = props.pedidoId;
    this.usuarioId = props.usuarioId;
    this.emailUsuario = props.emailUsuario;
    this.nomeUsuario = props.nomeUsuario;
    this.valorTotal = props.valorTotal;
    this.quantidadeItens = props.quantidadeItens;
  }
}
