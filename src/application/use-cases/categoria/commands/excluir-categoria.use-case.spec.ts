import { ExcluirCategoriaUseCase } from './excluir-categoria.use-case';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Categoria } from '@domain/entities/categoria.entity';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS } from '@infra/cache/cache-keys.constant';

const makeRepo = (): jest.Mocked<ICategoriaRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

const makeCache = (): jest.Mocked<AppCacheService> =>
  ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined), delByPrefix: jest.fn() } as unknown as jest.Mocked<AppCacheService>);

describe('ExcluirCategoriaUseCase', () => {
  let useCase: ExcluirCategoriaUseCase;
  let repo: jest.Mocked<ICategoriaRepository>;
  let cache: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    repo = makeRepo();
    cache = makeCache();
    useCase = new ExcluirCategoriaUseCase(repo, cache);
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
      new Categoria({ id: 3, nome: 'Esportes', descricao: 'desc', ativo: true, dataCadastro: new Date() }),
    );
    repo.deleteById.mockResolvedValue();

    await useCase.executar(3);

    expect(repo.deleteById).toHaveBeenCalledWith(3);
    expect(repo.deleteById).toHaveBeenCalledTimes(1);
  });

  it('returns void on success', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Categoria({ id: 1, nome: 'Livros', descricao: 'desc', ativo: true, dataCadastro: new Date() }),
    );
    repo.deleteById.mockResolvedValue();

    const result = await useCase.executar(1);

    expect(result).toBeUndefined();
  });

  it('invalidates CATEGORIAS_ALL and CATEGORIA_BY_ID after deletion', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Categoria({ id: 3, nome: 'Esportes', descricao: 'desc', ativo: true, dataCadastro: new Date() }),
    );
    repo.deleteById.mockResolvedValue();

    await useCase.executar(3);

    expect(cache.del).toHaveBeenCalledWith(CACHE_KEYS.CATEGORIAS_ALL);
    expect(cache.del).toHaveBeenCalledWith(CACHE_KEYS.CATEGORIA_BY_ID(3));
  });

  it('does not invalidate cache when categoria is not found', async () => {
    repo.findByIdOrThrow.mockRejectedValue(new ResourceNotFoundException('x'));

    await expect(useCase.executar(99)).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(cache.del).not.toHaveBeenCalled();
  });
});
