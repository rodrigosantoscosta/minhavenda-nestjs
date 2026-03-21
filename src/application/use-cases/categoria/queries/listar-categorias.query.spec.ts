import { ListarCategoriasQuery } from './listar-categorias.query';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
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

function makeCategoria(id: number, nome: string): Categoria {
  return new Categoria({
    id,
    nome,
    descricao: `desc ${nome}`,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('ListarCategoriasQuery', () => {
  let query: ListarCategoriasQuery;
  let repo: jest.Mocked<ICategoriaRepository>;
  let cache: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    repo = makeRepo();
    cache = makeCache();
    query = new ListarCategoriasQuery(repo, cache);
  });

  it('returns an empty array when there are no categorias', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await query.executar();

    expect(result).toEqual([]);
  });

  it('returns a mapped CategoriaDto list', async () => {
    repo.findAll.mockResolvedValue([
      makeCategoria(1, 'Eletrônicos'),
      makeCategoria(2, 'Roupas'),
    ]);

    const result = await query.executar();

    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe('Eletrônicos');
    expect(result[1].nome).toBe('Roupas');
  });

  it('coerces BIGSERIAL ids to number', async () => {
    const cat = makeCategoria(7, 'Casa');
    (cat as unknown as { id: unknown }).id = '7';
    repo.findAll.mockResolvedValue([cat]);

    const result = await query.executar();

    expect(result[0].id).toBe(7);
    expect(typeof result[0].id).toBe('number');
  });

  it('returns cached value on cache hit without calling the repo', async () => {
    const cached = [{ id: 1, nome: 'Cached' }];
    cache.get.mockResolvedValue(cached);

    const result = await query.executar();

    expect(result).toBe(cached);
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('stores result in cache on cache miss', async () => {
    repo.findAll.mockResolvedValue([makeCategoria(1, 'Eletrônicos')]);

    await query.executar();

    expect(cache.set).toHaveBeenCalledWith(
      CACHE_KEYS.CATEGORIAS_ALL,
      expect.any(Array),
      expect.any(Number),
    );
  });
});
