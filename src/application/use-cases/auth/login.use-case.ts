import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { Usuario } from '@domain/entities/usuario.entity';
import { LoginRequestDto } from '../../dtos/auth/login-request.dto';
import { AuthResponseDto } from '../../dtos/auth/auth-response.dto';
import type { JwtPayload } from '@infra/security/jwt.strategy';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IUSUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly jwtService: JwtService,
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

    return {
      token: this.assinarToken(usuario),
      email: usuario.email.valor,
      nome: usuario.nome,
    };
  }

  private assinarToken(usuario: Usuario): string {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email.valor,
      role: usuario.tipo,
      jti: randomUUID(),
    };
    return this.jwtService.sign(payload);
  }
}
