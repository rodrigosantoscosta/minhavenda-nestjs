import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterUseCase } from './register.use-case';
import { IUsuarioRepository } from '@domain/repositories/iusuario.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { Email } from '@domain/value-objects/email.value-object';
import { Usuario } from '@domain/entities/usuario.entity';

// Mock bcryptjs so tests don't do real hashing (slow + non-deterministic)
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const makeRepo = (): jest.Mocked<IUsuarioRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByEmail: jest.fn(),
  existsByEmail: jest.fn(),
  save: jest.fn(),
});

const makeJwt = (): jest.Mocked<Pick<JwtService, 'sign'>> => ({
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
});

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let repo: jest.Mocked<IUsuarioRepository>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    repo = makeRepo();
    jwt = makeJwt();
    useCase = new RegisterUseCase(repo, jwt as unknown as JwtService);
  });

  describe('executar', () => {
    const dto = {
      nome: 'João Silva',
      email: 'joao@example.com',
      senha: 'Senha@123',
    };

    it('throws EntityAlreadyExistsException when email is already in use', async () => {
      repo.existsByEmail.mockResolvedValue(true);

      await expect(useCase.executar(dto)).rejects.toBeInstanceOf(
        EntityAlreadyExistsException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('hashes the password with 12 rounds before saving', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      repo.save.mockImplementation(async (u) => u);

      await useCase.executar(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.senha, 12);
    });

    it('saves a new CLIENTE user with a random UUID', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      repo.save.mockImplementation(async (u) => u);

      await useCase.executar(dto);

      const saved = repo.save.mock.calls[0][0];
      expect(saved.tipo).toBe(TipoUsuario.CLIENTE);
      expect(saved.ativo).toBe(true);
      expect(saved.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('trims the nome field', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      repo.save.mockImplementation(async (u) => u);

      await useCase.executar({ ...dto, nome: '  João  ' });

      const saved = repo.save.mock.calls[0][0];
      expect(saved.nome).toBe('João');
    });

    it('returns token, email, and nome on success', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      repo.save.mockImplementation(async (u) => u);

      const result = await useCase.executar(dto);

      expect(result.token).toBe('signed.jwt.token');
      expect(result.email).toBe(dto.email);
      expect(result.nome).toBe(dto.nome.trim());
    });

    it('signs a JWT with sub, email, role, and jti', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      repo.save.mockImplementation(async (u) => u);

      await useCase.executar(dto);

      const payload = (jwt.sign as jest.Mock).mock.calls[0][0];
      expect(payload.email).toBe(dto.email);
      expect(payload.role).toBe(TipoUsuario.CLIENTE);
      expect(typeof payload.sub).toBe('string');
      expect(typeof payload.jti).toBe('string');
    });
  });
});
