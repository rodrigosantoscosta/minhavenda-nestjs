import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { LoginRequestDto } from '../../dtos/auth/login-request.dto';
import { AuthResponseDto } from '../../dtos/auth/auth-response.dto';
import { TokenService } from '@infra/security/token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IUSUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly tokenService: TokenService,
  ) {}

  async executar(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const usuario = await this.usuarioRepo.findByEmail(dto.email);

    // Generic message — do not reveal whether the email exists
    if (!usuario) {
      throw new BusinessException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha);
    if (!senhaValida) {
      throw new BusinessException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      throw new BusinessException('Usuário inativo');
    }

    const { accessToken, refreshToken } = await this.tokenService.signTokenPair(
      usuario.id,
      usuario.email.valor,
      usuario.tipo,
    );

    return {
      accessToken,
      refreshToken,
      email: usuario.email.valor,
      nome: usuario.nome,
    };
  }
}