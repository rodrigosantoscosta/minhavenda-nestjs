import { Notificacao } from '../entities/notificacao.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const INOTIFICACAO_REPOSITORY = Symbol('INotificacaoRepository');

export interface INotificacaoRepository {
  findById(id: number): Promise<Notificacao | null>;

  findByIdOrThrow(id: number): Promise<Notificacao>;

  save(notificacao: Notificacao): Promise<Notificacao>;
}

export function assertNotificacaoFound(
  notificacao: Notificacao | null,
  id: number,
): Notificacao {
  if (!notificacao) {
    throw new ResourceNotFoundException(`Notificação não encontrada: ${id}`);
  }

  return notificacao;
}
