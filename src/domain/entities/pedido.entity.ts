import { randomUUID } from 'node:crypto';
import {
  AfterLoad,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { ItemCarrinho } from './item-carrinho.entity';
import { ItemPedido } from './item-pedido.entity';
import { StatusPedido } from '../enums/status-pedido.enum';
import { BaseDomainEvent } from '../events/base-domain.event';
import { BusinessException } from '../exceptions/business.exception';
import { PedidoCriadoEvent } from '../events/pedido-criado.event';
import { PedidoPagoEvent } from '../events/pedido-pago.event';
import { PedidoEnviadoEvent } from '../events/pedido-enviado.event';
import { PedidoCanceladoEvent } from '../events/pedido-cancelado.event';

export interface PedidoProps {
  id: string;
  usuario: Usuario;
  status: StatusPedido;
  subtotal: number;
  valorFrete: number;
  valorDesconto: number;
  valorTotal: number;
  quantidadeItens: number;
  enderecoEntrega: string;
  observacoes: string | null;
  codigoRastreio: string | null;
  transportadora: string | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataPagamento: Date | null;
  dataEnvio: Date | null;
  dataEntrega: Date | null;
  itens: ItemPedido[];
  emailUsuario: string;
  nomeUsuario: string;
  telefoneUsuario: string;
}

export interface CriarPedidoParams {
  id?: string;
  usuario: Usuario;
  itensCarrinho: ItemCarrinho[];
  enderecoEntrega: string;
  observacoes?: string | null;
  telefoneUsuario?: string;
}

@Entity('pedidos')
export class Pedido {
  @PrimaryColumn({ type: 'uuid' })
  readonly id!: string;

  @ManyToOne(() => Usuario, {
    nullable: false,
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'varchar', length: 20, default: 'CRIADO' })
  status!: StatusPedido;

  /** DECIMAL(10,2) from DB — coerce to Number in the mapper */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({
    name: 'valor_frete',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  valorFrete!: number;

  @Column({
    name: 'valor_desconto',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  valorDesconto!: number;

  @Column({ name: 'valor_total', type: 'decimal', precision: 10, scale: 2 })
  valorTotal!: number;

  @Column({ name: 'quantidade_itens', type: 'int', default: 0 })
  quantidadeItens!: number;

  @Column({ name: 'endereco_entrega', type: 'varchar', length: 500 })
  enderecoEntrega!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  observacoes!: string | null;

  /** V10 migration added this column (with underscore). */
  @Column({
    name: 'codigo_rastreio',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  codigoRastreio!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transportadora!: string | null;

  @Column({
    name: 'data_criacao',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dataCriacao!: Date;

  @Column({
    name: 'data_atualizacao',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dataAtualizacao!: Date;

  @Column({ name: 'data_pagamento', type: 'timestamp', nullable: true })
  dataPagamento!: Date | null;

  @Column({ name: 'data_envio', type: 'timestamp', nullable: true })
  dataEnvio!: Date | null;

  @Column({ name: 'data_entrega', type: 'timestamp', nullable: true })
  dataEntrega!: Date | null;

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
    eager: false,
  })
  itens!: ItemPedido[];

  /**
   * Not DB columns — populated from the `usuario` relation by @AfterLoad when
   * hydrated from the database, or set explicitly via the constructor / factory.
   */
  emailUsuario!: string;
  nomeUsuario!: string;
  telefoneUsuario!: string;

  private readonly _events: BaseDomainEvent[] = [];

  /**
   * TypeORM requires a no-arg constructor for entity hydration.
   * When constructing in application code always pass props.
   */
  constructor(props?: PedidoProps) {
    if (props) {
      this.id = props.id;
      this.usuario = props.usuario;
      this.status = props.status;
      this.subtotal = props.subtotal;
      this.valorFrete = props.valorFrete;
      this.valorDesconto = props.valorDesconto;
      this.valorTotal = props.valorTotal;
      this.quantidadeItens = props.quantidadeItens;
      this.enderecoEntrega = props.enderecoEntrega;
      this.observacoes = props.observacoes;
      this.codigoRastreio = props.codigoRastreio;
      this.transportadora = props.transportadora;
      this.dataCriacao = props.dataCriacao;
      this.dataAtualizacao = props.dataAtualizacao;
      this.dataPagamento = props.dataPagamento;
      this.dataEnvio = props.dataEnvio;
      this.dataEntrega = props.dataEntrega;
      this.itens = props.itens;
      this.emailUsuario = props.emailUsuario;
      this.nomeUsuario = props.nomeUsuario;
      this.telefoneUsuario = props.telefoneUsuario;
    }
  }

  /**
   * Fires after TypeORM hydrates this entity from the database.
   * Populates the non-persisted convenience fields from the loaded `usuario` relation.
   * Uses `??=` so factory-constructed instances (where these are already set) are not overwritten.
   */
  @AfterLoad()
  private hydrateUserFields(): void {
    if (this.usuario) {
      this.emailUsuario ??= this.usuario.email?.valor ?? '';
      this.nomeUsuario ??= this.usuario.nome;
      this.telefoneUsuario ??= '';
    }
  }

  /**
   * Static factory: creates a new Pedido from a Carrinho.
   * Snapshots item prices, calculates totals, and emits PedidoCriadoEvent.
   * Must be called inside a transaction by FinalizarCheckoutUseCase.
   */
  static criarDoCarrinho(params: CriarPedidoParams): Pedido {
    const {
      usuario,
      itensCarrinho,
      enderecoEntrega,
      observacoes,
      telefoneUsuario,
    } = params;

    if (itensCarrinho.length === 0) {
      throw new BusinessException(
        'Não é possível criar um pedido com carrinho vazio',
      );
    }

    const subtotal = itensCarrinho.reduce(
      (sum, i) => sum + Number(i.subtotal),
      0,
    );
    const quantidadeItens = itensCarrinho.reduce(
      (sum, i) => sum + i.quantidade,
      0,
    );
    const now = new Date();
    const pedidoId = params.id ?? randomUUID();

    const pedido = new Pedido({
      id: pedidoId,
      usuario,
      status: StatusPedido.CRIADO,
      subtotal,
      valorFrete: 0,
      valorDesconto: 0,
      valorTotal: subtotal,
      quantidadeItens,
      enderecoEntrega,
      observacoes: observacoes ?? null,
      codigoRastreio: null,
      transportadora: null,
      dataCriacao: now,
      dataAtualizacao: now,
      dataPagamento: null,
      dataEnvio: null,
      dataEntrega: null,
      itens: [],
      emailUsuario: usuario.email.valor,
      nomeUsuario: usuario.nome,
      telefoneUsuario: telefoneUsuario ?? '',
    });

    // Snapshot each cart item into an order item (price/name captured at purchase time)
    for (const itemCarrinho of itensCarrinho) {
      pedido.itens.push(
        new ItemPedido({
          id: randomUUID(),
          pedido,
          produto: itemCarrinho.produto,
          produtoNome: itemCarrinho.produto.nome,
          quantidade: itemCarrinho.quantidade,
          precoUnitario: Number(itemCarrinho.precoUnitario),
          subtotal: Number(itemCarrinho.subtotal),
        }),
      );
    }

    pedido._events.push(
      new PedidoCriadoEvent({
        pedidoId,
        usuarioId: usuario.id,
        emailUsuario: usuario.email.valor,
        nomeUsuario: usuario.nome,
        valorTotal: subtotal,
        quantidadeItens,
      }),
    );

    return pedido;
  }

  marcarComoPago(metodoPagamento: string, valorPago: number): void {
    if (this.status !== StatusPedido.CRIADO) {
      throw new BusinessException(
        'Apenas pedidos com status CRIADO podem ser pagos',
      );
    }

    this.status = StatusPedido.PAGO;
    this.dataPagamento = new Date();
    this.dataAtualizacao = new Date();

    this._events.push(
      new PedidoPagoEvent({
        pedidoId: this.id,
        usuarioId: this.usuario.id,
        emailUsuario: this.emailUsuario,
        valorPago,
        metodoPagamento,
      }),
    );
  }

  marcarComoEnviado(codigoRastreio: string, transportadora: string): void {
    if (this.status !== StatusPedido.PAGO) {
      throw new BusinessException('Apenas pedidos pagos podem ser enviados');
    }

    this.status = StatusPedido.ENVIADO;
    this.codigoRastreio = codigoRastreio;
    this.transportadora = transportadora;
    this.dataEnvio = new Date();
    this.dataAtualizacao = new Date();

    this._events.push(
      new PedidoEnviadoEvent({
        pedidoId: this.id,
        usuarioId: this.usuario.id,
        emailUsuario: this.emailUsuario,
        nomeUsuario: this.nomeUsuario,
        codigoRastreio,
        transportadora,
        telefone: this.telefoneUsuario,
      }),
    );
  }

  marcarComoEntregue(): void {
    if (this.status !== StatusPedido.ENVIADO) {
      throw new BusinessException(
        'Apenas pedidos enviados podem ser marcados como entregues',
      );
    }

    this.status = StatusPedido.ENTREGUE;
    this.dataEntrega = new Date();
    this.dataAtualizacao = new Date();
    // No domain event for ENTREGUE per architecture (only 4 events: criado, pago, enviado, cancelado)
  }

  cancelar(motivo: string): void {
    if (
      this.status !== StatusPedido.CRIADO &&
      this.status !== StatusPedido.PAGO
    ) {
      throw new BusinessException(
        'Apenas pedidos CRIADO ou PAGO podem ser cancelados',
      );
    }

    this.status = StatusPedido.CANCELADO;
    this.dataAtualizacao = new Date();

    this._events.push(
      new PedidoCanceladoEvent({
        pedidoId: this.id,
        usuarioId: this.usuario.id,
        emailUsuario: this.emailUsuario,
        motivo,
      }),
    );
  }

  consumeEvents(): BaseDomainEvent[] {
    const pending = [...this._events];
    this._events.length = 0;
    return pending;
  }
}
