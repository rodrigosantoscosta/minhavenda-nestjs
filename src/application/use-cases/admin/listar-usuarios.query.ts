import { Inject, Injectable } from '@nestjs/common';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { UsuarioAdminDto } from '@app/dtos/admin/usuario-admin.dto';
import { Usuario } from '@domain/entities/usuario.entity';

@Injectable()
export class ListarUsuariosQuery {
  constructor(
    @Inject(IUSUARIO_REPOSITORY) private readonly usuarioRepo: IUsuarioRepository,
  ) {}

  async executar(): Promise<UsuarioAdminDto[]> {
    const usuarios = await this.usuarioRepo.findAll();
    return usuarios.map(ListarUsuariosQuery.toDto);
  }

  async executarPorId(id: string): Promise<UsuarioAdminDto> {
    const usuario = await this.usuarioRepo.findByIdOrThrow(id);
    return ListarUsuariosQuery.toDto(usuario);
  }

  static toDto(usuario: Usuario): UsuarioAdminDto {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email.valor,
      tipo: usuario.tipo,
      ativo: usuario.ativo,
      dataCadastro: usuario.dataCadastro,
    };
  }
}
