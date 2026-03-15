import { Inject, Injectable } from '@nestjs/common';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { UsuarioAdminDto } from '@app/dtos/admin/usuario-admin.dto';
import { ListarUsuariosQuery } from './listar-usuarios.query';

@Injectable()
export class AtivarUsuarioUseCase {
  constructor(
    @Inject(IUSUARIO_REPOSITORY) private readonly usuarioRepo: IUsuarioRepository,
  ) {}

  async executar(id: string): Promise<UsuarioAdminDto> {
    const usuario = await this.usuarioRepo.findByIdOrThrow(id);
    usuario.ativo = true;
    const salvo = await this.usuarioRepo.save(usuario);
    return ListarUsuariosQuery.toDto(salvo);
  }
}
