import * as bcrypt from 'bcryptjs';
import { AlterarSenhaUseCase } from './alterar-senha.use-case';
import { IUsuarioRepository } from '@domain/repositories/iusuario.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { Email } from '@domain/value-objects/email.value-object';
import { Usuario } from '@domain/entities/usuario.entity';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('new_hashed_password'),
}));

const makeRepo = (): jest.Mocked<IUsuarioRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByEmail: jest.fn(),
  existsByEmail: jest.fn(),
  save: jest.fn(),
});

function makeUsuario(): Usuario {
  return new Usuario({
    id: 'uuid-456',
    nome: 'Pedro',
    email: new Email('pedro@example.com'),
    senha: 'old_hashed_password',
    tipo: TipoUsuario.CLIENTE,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('AlterarSenhaUseCase', () => {
  let useCase: AlterarSenhaUseCase;
  let repo: jest.Mocked<IUsuarioRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new AlterarSenhaUseCase(repo);
  });

  const dto = { senhaAtual: 'OldPass@123', novaSenha: 'NewPass@456' };

  it('throws ResourceNotFoundException when user does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('Usuário não encontrado'),
    );

    await expect(useCase.executar('unknown-id', dto)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('throws BusinessException when the current password is wrong', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeUsuario());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.executar('uuid-456', dto)).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws BusinessException when new password is the same as the current password', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeUsuario());
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const samePasswordDto = { senhaAtual: 'Same@123', novaSenha: 'Same@123' };

    await expect(
      useCase.executar('uuid-456', samePasswordDto),
    ).rejects.toBeInstanceOf(BusinessException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('hashes the new password with 12 rounds and saves', async () => {
    const usuario = makeUsuario();
    repo.findByIdOrThrow.mockResolvedValue(usuario);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    repo.save.mockResolvedValue(usuario);

    await useCase.executar('uuid-456', dto);

    expect(bcrypt.hash).toHaveBeenCalledWith(dto.novaSenha, 12);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ senha: 'new_hashed_password' }),
    );
  });

  it('returns void on success', async () => {
    const usuario = makeUsuario();
    repo.findByIdOrThrow.mockResolvedValue(usuario);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    repo.save.mockResolvedValue(usuario);

    const result = await useCase.executar('uuid-456', dto);

    expect(result).toBeUndefined();
  });
});
