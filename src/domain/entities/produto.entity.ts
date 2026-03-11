import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { ValueTransformer } from 'typeorm';
import { Categoria } from './categoria.entity';
import { Money } from '../value-objects/money.value-object';

/** Persists Money.valor as DECIMAL and reconstructs Money on load. Moeda is always 'BRL'. */
const moneyTransformer: ValueTransformer = {
  to: (money: Money): string | null =>
    money != null ? money.valor.toFixed(2) : null,
  from: (val: string | null | undefined): Money =>
    val != null ? Money.of(val) : Money.zero(),
};

export interface ProdutoProps {
  id: string;
  nome: string;
  descricao: string;
  preco: Money;
  urlImagem?: string | null;
  pesoKg?: number | null;
  alturaCm?: number | null;
  larguraCm?: number | null;
  comprimentoCm?: number | null;
  categoria?: Categoria | null;
  ativo: boolean;
  dataCadastro: Date;
}

@Entity('produtos')
export class Produto {
  @PrimaryColumn({ type: 'uuid' })
  readonly id!: string;

  @Column({ length: 150 })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: moneyTransformer,
  })
  preco!: Money;

  /** Always 'BRL'. Stored separately to match the DB schema from the Java migration. */
  @Column({ length: 3, default: 'BRL' })
  moeda: string = 'BRL';

  @Column({ name: 'url_imagem', type: 'varchar', length: 255, nullable: true })
  urlImagem!: string | null;

  @Column({
    name: 'peso_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  pesoKg!: number | null;

  @Column({ name: 'altura_cm', type: 'int', nullable: true })
  alturaCm!: number | null;

  @Column({ name: 'largura_cm', type: 'int', nullable: true })
  larguraCm!: number | null;

  @Column({ name: 'comprimento_cm', type: 'int', nullable: true })
  comprimentoCm!: number | null;

  @ManyToOne(() => Categoria, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria!: Categoria | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({
    name: 'data_cadastro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dataCadastro!: Date;

  /**
   * TypeORM requires a no-arg constructor for entity hydration.
   * When constructing in application code, always pass props.
   */
  constructor(props?: ProdutoProps) {
    if (props) {
      this.id = props.id;
      this.nome = props.nome;
      this.descricao = props.descricao;
      this.preco = props.preco;
      this.moeda = 'BRL';
      this.urlImagem = props.urlImagem ?? null;
      this.pesoKg = props.pesoKg ?? null;
      this.alturaCm = props.alturaCm ?? null;
      this.larguraCm = props.larguraCm ?? null;
      this.comprimentoCm = props.comprimentoCm ?? null;
      this.categoria = props.categoria ?? null;
      this.ativo = props.ativo;
      this.dataCadastro = props.dataCadastro;
    }
  }
}
