import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Carrinho } from './carrinho.entity';
import { Produto } from './produto.entity';
import { BusinessException } from '../exceptions/business.exception';

export interface ItemCarrinhoProps {
  id: string;
  carrinho: Carrinho;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

@Entity('itens_carrinho')
export class ItemCarrinho {
  @PrimaryColumn({ type: 'uuid' })
  readonly id!: string;

  @ManyToOne(() => Carrinho, (carrinho) => carrinho.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carrinho_id' })
  carrinho!: Carrinho;

  @ManyToOne(() => Produto, {
    nullable: false,
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({ name: 'produto_id' })
  produto!: Produto;

  @Column({ type: 'int' })
  quantidade!: number;

  /** DECIMAL(10,2) from DB — coerce to number in the mapper */
  @Column({ name: 'preco_unitario', type: 'decimal', precision: 10, scale: 2 })
  precoUnitario!: number;

  /** DECIMAL(10,2) from DB — coerce to number in the mapper */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  /**
   * TypeORM requires a no-arg constructor for entity hydration.
   * When constructing in application code always pass props.
   */
  constructor(props?: ItemCarrinhoProps) {
    if (props) {
      if (props.quantidade <= 0) {
        throw new BusinessException(
          'Quantidade do item do carrinho deve ser maior que zero',
        );
      }

      this.id = props.id;
      this.carrinho = props.carrinho;
      this.produto = props.produto;
      this.quantidade = props.quantidade;
      this.precoUnitario = props.precoUnitario;
      this.subtotal = props.subtotal;
    }
  }

  atualizarQuantidade(novaQuantidade: number): void {
    if (novaQuantidade <= 0) {
      throw new BusinessException(
        'Quantidade do item do carrinho deve ser maior que zero',
      );
    }

    this.quantidade = novaQuantidade;
    this.recalcularSubtotal();
  }

  recalcularSubtotal(): void {
    this.subtotal = Number(this.precoUnitario) * this.quantidade;
  }
}
