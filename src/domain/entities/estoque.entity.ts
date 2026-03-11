import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BusinessException } from '../exceptions/business.exception';
import { Produto } from './produto.entity';

export interface EstoqueProps {
  id?: number;
  produto: Produto;
  quantidade: number;
  atualizadoEm: Date;
}

@Entity('estoques')
export class Estoque {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id!: number;

  @OneToOne(() => Produto, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'produto_id' })
  produto!: Produto;

  @Column({ type: 'int', default: 0 })
  quantidade!: number;

  @Column({
    name: 'atualizado_em',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  atualizadoEm!: Date;

  constructor(props?: EstoqueProps) {
    if (props) {
      if (props.id !== undefined) (this as { id: number }).id = props.id;
      this.produto = props.produto;
      this.quantidade = props.quantidade;
      this.atualizadoEm = props.atualizadoEm;

      if (this.quantidade < 0) {
        throw new BusinessException(
          'Quantidade em estoque não pode ser negativa',
        );
      }
    }
  }

  adicionar(quantidade: number): void {
    if (quantidade <= 0) {
      throw new BusinessException('Quantidade a adicionar deve ser positiva');
    }

    this.quantidade += quantidade;
    this.atualizadoEm = new Date();
  }

  remover(quantidade: number): void {
    if (quantidade <= 0) {
      throw new BusinessException('Quantidade a remover deve ser positiva');
    }

    if (this.quantidade < quantidade) {
      throw new BusinessException('Estoque insuficiente para remoção');
    }

    this.quantidade -= quantidade;
    this.atualizadoEm = new Date();
  }

  reservar(quantidade: number): void {
    this.remover(quantidade);
  }

  /** Reverses a prior reservation — used when an order is cancelled to restore stock. */
  liberar(quantidade: number): void {
    this.adicionar(quantidade);
  }

  ajustar(quantidade: number): void {
    if (quantidade < 0) {
      throw new BusinessException(
        'Quantidade em estoque não pode ser negativa',
      );
    }

    this.quantidade = quantidade;
    this.atualizadoEm = new Date();
  }

  temEstoqueSuficiente(quantidade: number): boolean {
    return this.quantidade >= quantidade;
  }

  isSemEstoque(): boolean {
    return this.quantidade === 0;
  }

  isEstoqueBaixo(limiteMinimo: number): boolean {
    return this.quantidade <= limiteMinimo;
  }
}
