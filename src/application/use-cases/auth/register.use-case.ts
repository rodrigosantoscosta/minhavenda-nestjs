import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { Usuario } from '@domain/entities/usuario.entity';
import { Email } from '@domain/value-objects/email.value-object';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { RegisterRequestDto } from '../../dtos/auth/register-request.dto';
import { AuthResponseDto } from '../../dtos/auth/auth-response.dto';
import { TokenService } from '@infra/security/token.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(IUSUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly tokenService: TokenService,
  ) {}

  async executar(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const emailExiste = await this.usuarioRepo.existsByEmail(dto.email);
    if (emailExiste) {
      throw new EntityAlreadyExistsException('Email já está em uso');
    }

    const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);

    const usuario = new Usuario({
      id: randomUUID(),
      nome: dto.nome.trim(),
      email: new Email(dto.email),
      senha: senhaHash,
      tipo: TipoUsuario.CLIENTE,
      ativo: true,
      dataCadastro: new Date(),
    });

    const saved = await this.usuarioRepo.save(usuario);

    const { accessToken, refreshToken } = await this.tokenService.signTokenPair(
      saved.id,
      saved.email.valor,
      saved.tipo,
    );

    return {
      accessToken,
      refreshToken,
      email: saved.email.valor,
      nome: saved.nome,
    };
  }
}