import { Inject, Injectable } from '@nestjs/common';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { BusinessException } from '@domain/exceptions/business.exception';
import { UsuarioAdminDto } from '@app/dtos/admin/usuario-admin.dto';
import { ListarUsuariosQuery } from './listar-usuarios.query';

@Injectable()
export class DesativarUsuarioUseCase {
  constructor(
    @Inject(IUSUARIO_REPOSITORY) private readonly usuarioRepo: IUsuarioRepository,
  ) {}

  async executar(id: string): Promise<UsuarioAdminDto> {
    const usuario = await this.usuarioRepo.findByIdOrThrow(id);

    // Guard: cannot deactivate the last active ADMIN
    if (usuario.tipo === TipoUsuario.ADMIN && usuario.ativo) {
      const todos = await this.usuarioRepo.findAll();
      const adminsAtivos = todos.filter(
        (u) => u.tipo === TipoUsuario.ADMIN && u.ativo,
      );
      if (adminsAtivos.length <= 1) {
        throw new BusinessException(
          'Não é possível desativar o último administrador ativo do sistema',
        );
      }
    }

    usuario.ativo = false;
    const salvo = await this.usuarioRepo.save(usuario);
    return ListarUsuariosQuery.toDto(salvo);
  }
}
