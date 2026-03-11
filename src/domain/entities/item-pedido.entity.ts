import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Pedido } from './pedido.entity';
import { Produto } from './produto.entity';

export interface ItemPedidoProps {
  id: string;
  pedido: Pedido;
  produto: Produto;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

@Entity('itens_pedido')
export class ItemPedido {
  @PrimaryColumn({ type: 'uuid' })
  readonly id!: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Pedido;

  @ManyToOne(() => Produto, {
    nullable: false,
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({ name: 'produto_id' })
  produto!: Produto;

  /** Price and name snapshotted at order time — decoupled from the live Produto record. */
  @Column({ name: 'produto_nome', type: 'varchar', length: 200 })
  readonly produtoNome!: string;

  @Column({ type: 'int' })
  readonly quantidade!: number;

  /** DECIMAL(10,2) from DB — coerce to Number in the mapper */
  @Column({ name: 'preco_unitario', type: 'decimal', precision: 10, scale: 2 })
  readonly precoUnitario!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  readonly subtotal!: number;

  /**
   * TypeORM requires a no-arg constructor for entity hydration.
   * When constructing in application code always pass props.
   */
  constructor(props?: ItemPedidoProps) {
    if (props) {
      this.id = props.id;
      this.pedido = props.pedido;
      this.produto = props.produto;
      this.produtoNome = props.produtoNome;
      this.quantidade = props.quantidade;
      this.precoUnitario = props.precoUnitario;
      this.subtotal = props.subtotal;
    }
  }
}
