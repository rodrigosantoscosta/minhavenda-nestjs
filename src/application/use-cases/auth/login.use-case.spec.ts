import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginUseCase } from './login.use-case';
import { IUsuarioRepository } from '@domain/repositories/iusuario.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { Email } from '@domain/value-objects/email.value-object';
import { Usuario } from '@domain/entities/usuario.entity';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const makeRepo = (): jest.Mocked<IUsuarioRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByEmail: jest.fn(),
  existsByEmail: jest.fn(),
  save: jest.fn(),
});

const makeJwt = (): jest.Mocked<Pick<JwtService, 'sign'>> => ({
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
});

function makeUsuario(overrides: Partial<{ ativo: boolean }> = {}): Usuario {
  return new Usuario({
    id: 'uuid-123',
    nome: 'Maria',
    email: new Email('maria@example.com'),
    senha: 'hashed_password',
    tipo: TipoUsuario.CLIENTE,
    ativo: overrides.ativo ?? true,
    dataCadastro: new Date(),
  });
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repo: jest.Mocked<IUsuarioRepository>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    repo = makeRepo();
    jwt = makeJwt();
    useCase = new LoginUseCase(repo, jwt as unknown as JwtService);
  });

  const dto = { email: 'maria@example.com', senha: 'Senha@123' };

  it('throws BusinessException with a generic message when email is not registered', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(useCase.executar(dto)).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('throws BusinessException with a generic message when password is wrong', async () => {
    repo.findByEmail.mockResolvedValue(makeUsuario());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.executar(dto)).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('throws BusinessException when user is inactive', async () => {
    repo.findByEmail.mockResolvedValue(makeUsuario({ ativo: false }));
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.executar(dto)).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('returns token, email, and nome on successful login', async () => {
    repo.findByEmail.mockResolvedValue(makeUsuario());
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await useCase.executar(dto);

    expect(result.token).toBe('signed.jwt.token');
    expect(result.email).toBe('maria@example.com');
    expect(result.nome).toBe('Maria');
  });

  it('signs a JWT containing sub, email, role, and jti', async () => {
    repo.findByEmail.mockResolvedValue(makeUsuario());
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await useCase.executar(dto);

    const payload = (jwt.sign as jest.Mock).mock.calls[0][0];
    expect(payload.sub).toBe('uuid-123');
    expect(payload.email).toBe('maria@example.com');
    expect(payload.role).toBe(TipoUsuario.CLIENTE);
    expect(typeof payload.jti).toBe('string');
  });

  it('does not reveal whether the email exists (same error message for both failure modes)', async () => {
    // Email not found
    repo.findByEmail.mockResolvedValue(null);
    let err1: BusinessException | null = null;
    try {
      await useCase.executar(dto);
    } catch (e) {
      err1 = e as BusinessException;
    }

    // Wrong password
    repo.findByEmail.mockResolvedValue(makeUsuario());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    let err2: BusinessException | null = null;
    try {
      await useCase.executar(dto);
    } catch (e) {
      err2 = e as BusinessException;
    }

    expect(err1?.message).toBe(err2?.message);
  });
});
