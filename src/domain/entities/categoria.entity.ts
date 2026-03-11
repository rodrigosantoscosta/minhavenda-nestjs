import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface CategoriaProps {
  id?: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  dataCadastro: Date;
}

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id!: number;

  @Column({ length: 100, unique: true })
  nome!: string;

  @Column({ length: 500 })
  descricao!: string;

  @Column({ default: true })
  ativo!: boolean;

  @Column({
    name: 'data_cadastro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dataCadastro!: Date;

  constructor(props?: CategoriaProps) {
    if (props) {
      if (props.id !== undefined) (this as { id: number }).id = props.id;
      this.nome = props.nome;
      this.descricao = props.descricao;
      this.ativo = props.ativo;
      this.dataCadastro = props.dataCadastro;
    }
  }
}
