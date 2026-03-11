import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { ItemCarrinho } from './item-carrinho.entity';
import { StatusCarrinho } from '../enums/status-carrinho.enum';
import { BusinessException } from '../exceptions/business.exception';

export interface CarrinhoProps {
  id: string;
  usuario: Usuario;
  status: StatusCarrinho;
  itens: ItemCarrinho[];
  valorTotal: number;
  quantidadeTotal: number;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

@Entity('carrinhos')
export class Carrinho {
  @PrimaryColumn({ type: 'uuid' })
  readonly id!: string;

  @ManyToOne(() => Usuario, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'varchar', length: 20, default: 'ATIVO' })
  status!: StatusCarrinho;

  /**
   * cascade: true — persist/update/remove all child items when the cart is saved.
   * orphanedRowAction: 'delete' — items removed from the array are deleted from the DB.
   */
  @OneToMany(() => ItemCarrinho, (item) => item.carrinho, {
    cascade: true,
    orphanedRowAction: 'delete',
    eager: false,
  })
  itens!: ItemCarrinho[];

  /** DECIMAL(10,2) from DB — coerce to number in the mapper */
  @Column({
    name: 'valor_total',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  valorTotal!: number;

  @Column({ name: 'quantidade_total', type: 'int', default: 0 })
  quantidadeTotal!: number;

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

  /**
   * TypeORM requires a no-arg constructor for entity hydration.
   * When constructing in application code always pass props.
   */
  constructor(props?: CarrinhoProps) {
    if (props) {
      this.id = props.id;
      this.usuario = props.usuario;
      this.status = props.status;
      this.itens = props.itens;
      this.valorTotal = props.valorTotal;
      this.quantidadeTotal = props.quantidadeTotal;
      this.dataCriacao = props.dataCriacao;
      this.dataAtualizacao = props.dataAtualizacao;
    }
  }

  adicionarItem(item: ItemCarrinho): void {
    if (this.status !== StatusCarrinho.ATIVO) {
      throw new BusinessException(
        'Não é possível adicionar itens a um carrinho não ativo',
      );
    }

    const existente = this.itens.find((i) => i.produto.id === item.produto.id);

    if (existente) {
      existente.atualizarQuantidade(existente.quantidade + item.quantidade);
    } else {
      this.itens.push(item);
    }

    this.calcularValorTotal();
  }

  removerItem(itemId: string): void {
    if (this.status !== StatusCarrinho.ATIVO) {
      throw new BusinessException(
        'Não é possível remover itens de um carrinho não ativo',
      );
    }

    this.itens = this.itens.filter((item) => item.id !== itemId);
    this.calcularValorTotal();
  }

  calcularValorTotal(): void {
    this.valorTotal = this.itens.reduce(
      (total, item) => total + item.subtotal,
      0,
    );
    this.quantidadeTotal = this.itens.reduce(
      (total, item) => total + item.quantidade,
      0,
    );
    this.dataAtualizacao = new Date();
  }

  finalizar(): void {
    if (this.itens.length === 0) {
      throw new BusinessException('Não é possível finalizar um carrinho vazio');
    }

    if (this.status !== StatusCarrinho.ATIVO) {
      throw new BusinessException(
        'Apenas carrinhos ativos podem ser finalizados',
      );
    }

    this.status = StatusCarrinho.FINALIZADO;
    this.dataAtualizacao = new Date();
  }
}
