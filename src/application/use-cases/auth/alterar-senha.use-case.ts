import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { AlterarSenhaRequestDto } from '../../dtos/auth/alterar-senha-request.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AlterarSenhaUseCase {
  constructor(
    @Inject(IUSUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
  ) {}

  async executar(
    usuarioId: string,
    dto: AlterarSenhaRequestDto,
  ): Promise<void> {
    const usuario = await this.usuarioRepo.findByIdOrThrow(usuarioId);

    const senhaAtualValida = await bcrypt.compare(
      dto.senhaAtual,
      usuario.senha,
    );
    if (!senhaAtualValida) {
      throw new BusinessException('Senha atual incorreta');
    }

    if (dto.senhaAtual === dto.novaSenha) {
      throw new BusinessException(
        'A nova senha deve ser diferente da senha atual',
      );
    }

    usuario.senha = await bcrypt.hash(dto.novaSenha, BCRYPT_ROUNDS);
    await this.usuarioRepo.save(usuario);
  }
}
