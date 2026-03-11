import { Entity, PrimaryColumn, Column } from 'typeorm';
import type { ValueTransformer } from 'typeorm';
import { Email } from '../value-objects/email.value-object';
import { TipoUsuario } from '../enums/tipo-usuario.enum';

/** Transforms Email VO ↔ plain varchar for TypeORM persistence */
const emailTransformer: ValueTransformer = {
  to: (email: Email): string | null => (email != null ? email.valor : null),
  from: (valor: string | null | undefined): Email | null =>
    valor != null ? new Email(valor) : null,
};

export interface UsuarioProps {
  id: string;
  nome: string;
  email: Email;
  senha: string;
  tipo: TipoUsuario;
  ativo: boolean;
  dataCadastro: Date;
}

@Entity('usuarios')
export class Usuario {
  @PrimaryColumn({ type: 'uuid' })
  readonly id!: string;

  @Column({ length: 150 })
  nome!: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    transformer: emailTransformer,
  })
  email!: Email;

  @Column({ length: 255 })
  senha!: string;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoUsuario;

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
  constructor(props?: UsuarioProps) {
    if (props) {
      this.id = props.id;
      this.nome = props.nome;
      this.email = props.email;
      this.senha = props.senha;
      this.tipo = props.tipo;
      this.ativo = props.ativo;
      this.dataCadastro = props.dataCadastro;
    }
  }
}
