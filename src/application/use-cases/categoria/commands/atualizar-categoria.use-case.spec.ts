import { AtualizarCategoriaUseCase } from './atualizar-categoria.use-case';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Categoria } from '@domain/entities/categoria.entity';

const makeRepo = (): jest.Mocked<ICategoriaRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

function makeCategoria(id: number, nome: string, ativo = true): Categoria {
  return new Categoria({
    id,
    nome,
    descricao: 'descricao original',
    ativo,
    dataCadastro: new Date(),
  });
}

describe('AtualizarCategoriaUseCase', () => {
  let useCase: AtualizarCategoriaUseCase;
  let repo: jest.Mocked<ICategoriaRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new AtualizarCategoriaUseCase(repo);
  });

  it('throws ResourceNotFoundException when categoria does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrada'),
    );

    await expect(useCase.executar(99, { nome: 'X' })).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updates nome when it is different and unique', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeCategoria(1, 'Roupas'));
    repo.findAll.mockResolvedValue([
      makeCategoria(1, 'Roupas'),
      makeCategoria(2, 'Livros'),
    ]);
    repo.save.mockImplementation(async (c) => c);

    const result = await useCase.executar(1, { nome: 'Vestuário' });

    expect(result.nome).toBe('Vestuário');
  });

  it('does not check for duplicates when nome is same as current (case-insensitive)', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeCategoria(1, 'Roupas'));
    repo.save.mockImplementation(async (c) => c);

    // Same name, different case — should NOT call findAll or throw
    await expect(
      useCase.executar(1, { nome: 'roupas' }),
    ).resolves.not.toThrow();
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('throws EntityAlreadyExistsException when new nome conflicts with another categoria', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeCategoria(1, 'Roupas'));
    repo.findAll.mockResolvedValue([
      makeCategoria(1, 'Roupas'),
      makeCategoria(2, 'Livros'),
    ]);

    await expect(
      useCase.executar(1, { nome: 'livros' }),
    ).rejects.toBeInstanceOf(EntityAlreadyExistsException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updates descricao independently of nome', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeCategoria(1, 'Roupas'));
    repo.save.mockImplementation(async (c) => c);

    const result = await useCase.executar(1, { descricao: '  nova desc  ' });

    expect(result.descricao).toBe('nova desc');
    expect(result.nome).toBe('Roupas'); // unchanged
  });

  it('updates ativo flag', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeCategoria(1, 'Roupas', true));
    repo.save.mockImplementation(async (c) => c);

    const result = await useCase.executar(1, { ativo: false });

    expect(result.ativo).toBe(false);
  });

  it('performs partial update — ignores undefined fields', async () => {
    const original = makeCategoria(1, 'Roupas');
    repo.findByIdOrThrow.mockResolvedValue(original);
    repo.save.mockImplementation(async (c) => c);

    // Only ativo provided — nome and descricao must be unchanged
    await useCase.executar(1, { ativo: false });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.nome).toBe('Roupas');
    expect(saved.descricao).toBe('descricao original');
  });
});
