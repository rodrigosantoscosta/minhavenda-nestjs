import { Usuario } from '../entities/usuario.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const IUSUARIO_REPOSITORY = Symbol('IUsuarioRepository');

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;

  findByIdOrThrow(id: string): Promise<Usuario>;

  findByEmail(email: string): Promise<Usuario | null>;

  existsByEmail(email: string): Promise<boolean>;

  save(usuario: Usuario): Promise<Usuario>;
}

export function assertUsuarioFound(
  usuario: Usuario | null,
  idOrEmail: string,
  field: 'id' | 'email' = 'id',
): Usuario {
  if (!usuario) {
    throw new ResourceNotFoundException(
      `Usuário não encontrado com ${field}: ${idOrEmail}`,
    );
  }

  return usuario;
}
