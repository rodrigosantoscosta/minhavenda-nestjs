import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export type TipoNotificacao = 'EMAIL' | 'SMS';

export interface NotificacaoProps {
  id?: number;
  usuario: Usuario;
  tipo: TipoNotificacao;
  mensagem: string;
  enviado: boolean;
  enviadoEm: Date | null;
}

@Entity('notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id!: number;

  @ManyToOne(() => Usuario, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'usuario_id' })
  readonly usuario!: Usuario;

  @Column({ type: 'varchar', length: 10 })
  readonly tipo!: TipoNotificacao;

  @Column({ type: 'varchar', length: 1000 })
  readonly mensagem!: string;

  @Column({ type: 'boolean', default: false })
  enviado!: boolean;

  @Column({ name: 'enviado_em', type: 'timestamp', nullable: true })
  enviadoEm!: Date | null;

  constructor(props?: NotificacaoProps) {
    if (props) {
      if (props.id !== undefined) {
        (this as { id: number }).id = props.id;
      }
      (this as { usuario: Usuario }).usuario = props.usuario;
      (this as { tipo: TipoNotificacao }).tipo = props.tipo;
      (this as { mensagem: string }).mensagem = props.mensagem;
      this.enviado = props.enviado;
      this.enviadoEm = props.enviadoEm;
    }
  }
}
