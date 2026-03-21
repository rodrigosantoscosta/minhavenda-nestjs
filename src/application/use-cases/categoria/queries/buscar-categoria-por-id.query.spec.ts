import { BuscarCategoriaPorIdQuery } from './buscar-categoria-por-id.query';
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
  ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn(), delByPrefix: jest.fn() } as unknown as jest.Mocked<AppCacheService>);

describe('BuscarCategoriaPorIdQuery', () => {
  let query: BuscarCategoriaPorIdQuery;
  let repo: jest.Mocked<ICategoriaRepository>;
  let cache: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    repo = makeRepo();
    cache = makeCache();
    query = new BuscarCategoriaPorIdQuery(repo, cache);
  });

  it('throws ResourceNotFoundException when categoria does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrada'),
    );

    await expect(query.executar(99)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('returns CategoriaDto with all fields mapped correctly', async () => {
    const dataCadastro = new Date('2024-01-15');
    repo.findByIdOrThrow.mockResolvedValue(
      new Categoria({
        id: 4,
        nome: 'Livros',
        descricao: 'Livros e publicações',
        ativo: true,
        dataCadastro,
      }),
    );

    const result = await query.executar(4);

    expect(result.id).toBe(4);
    expect(result.nome).toBe('Livros');
    expect(result.descricao).toBe('Livros e publicações');
    expect(result.ativo).toBe(true);
    expect(result.dataCadastro).toEqual(dataCadastro);
  });

  it('coerces BIGSERIAL id to number', async () => {
    const cat = new Categoria({
      id: 2,
      nome: 'Roupas',
      descricao: 'desc',
      ativo: true,
      dataCadastro: new Date(),
    });
    (cat as unknown as { id: unknown }).id = '2';
    repo.findByIdOrThrow.mockResolvedValue(cat);

    const result = await query.executar(2);

    expect(typeof result.id).toBe('number');
    expect(result.id).toBe(2);
  });

  it('returns cached value on cache hit without calling the repo', async () => {
    const cached = { id: 4, nome: 'Cached' };
    cache.get.mockResolvedValue(cached);

    const result = await query.executar(4);

    expect(result).toBe(cached);
    expect(repo.findByIdOrThrow).not.toHaveBeenCalled();
  });

  it('stores result in cache on cache miss', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Categoria({ id: 4, nome: 'Livros', descricao: 'desc', ativo: true, dataCadastro: new Date() }),
    );

    await query.executar(4);

    expect(cache.set).toHaveBeenCalledWith(
      CACHE_KEYS.CATEGORIA_BY_ID(4),
      expect.any(Object),
      expect.any(Number),
    );
  });
});
