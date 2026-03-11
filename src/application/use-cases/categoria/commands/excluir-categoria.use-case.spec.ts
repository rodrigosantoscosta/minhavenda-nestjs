import { ExcluirCategoriaUseCase } from './excluir-categoria.use-case';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Categoria } from '@domain/entities/categoria.entity';

const makeRepo = (): jest.Mocked<ICategoriaRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

describe('ExcluirCategoriaUseCase', () => {
  let useCase: ExcluirCategoriaUseCase;
  let repo: jest.Mocked<ICategoriaRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ExcluirCategoriaUseCase(repo);
  });

  it('throws ResourceNotFoundException when categoria does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrada'),
    );

    await expect(useCase.executar(99)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('calls deleteById with the correct id on success', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Categoria({
        id: 3,
        nome: 'Esportes',
        descricao: 'desc',
        ativo: true,
        dataCadastro: new Date(),
      }),
    );
    repo.deleteById.mockResolvedValue();

    await useCase.executar(3);

    expect(repo.deleteById).toHaveBeenCalledWith(3);
    expect(repo.deleteById).toHaveBeenCalledTimes(1);
  });

  it('returns void on success', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Categoria({
        id: 1,
        nome: 'Livros',
        descricao: 'desc',
        ativo: true,
        dataCadastro: new Date(),
      }),
    );
    repo.deleteById.mockResolvedValue();

    const result = await useCase.executar(1);

    expect(result).toBeUndefined();
  });
});
