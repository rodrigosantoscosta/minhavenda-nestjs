import { BuscarProdutoPorIdQuery } from './buscar-produto-por-id.query';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Produto } from '@domain/entities/produto.entity';
import { Categoria } from '@domain/entities/categoria.entity';
import { Money } from '@domain/value-objects/money.value-object';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS } from '@infra/cache/cache-keys.constant';

const makeRepo = (): jest.Mocked<IProdutoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
  findAllPaginated: jest.fn(),
});

const makeCache = (): jest.Mocked<AppCacheService> =>
  ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn(), delByPrefix: jest.fn() } as unknown as jest.Mocked<AppCacheService>);

describe('BuscarProdutoPorIdQuery', () => {
  let query: BuscarProdutoPorIdQuery;
  let repo: jest.Mocked<IProdutoRepository>;
  let cache: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    repo = makeRepo();
    cache = makeCache();
    query = new BuscarProdutoPorIdQuery(repo, cache);
  });

  it('throws ResourceNotFoundException when produto does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(query.executar('unknown-uuid')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('returns ProdutoDto with all scalar fields mapped correctly', async () => {
    const dataCadastro = new Date('2024-03-01');
    const produto = new Produto({
      id: 'uuid-prod-1',
      nome: 'Teclado Mecânico',
      descricao: 'Switches Cherry MX Red',
      preco: Money.of(450),
      urlImagem: 'https://example.com/teclado.jpg',
      pesoKg: 1.2,
      alturaCm: 4,
      larguraCm: 36,
      comprimentoCm: 14,
      categoria: null,
      ativo: true,
      dataCadastro,
    });
    repo.findByIdOrThrow.mockResolvedValue(produto);

    const result = await query.executar('uuid-prod-1');

    expect(result.id).toBe('uuid-prod-1');
    expect(result.nome).toBe('Teclado Mecânico');
    expect(result.preco).toBe(450);
    expect(result.moeda).toBe('BRL');
    expect(result.urlImagem).toBe('https://example.com/teclado.jpg');
    expect(result.pesoKg).toBeCloseTo(1.2);
    expect(result.ativo).toBe(true);
    expect(result.dataCadastro).toEqual(dataCadastro);
    expect(result.categoriaId).toBeNull();
  });

  it('maps categoria id and nome when produto has a categoria', async () => {
    const cat = new Categoria({
      id: 5,
      nome: 'Periféricos',
      descricao: 'desc',
      ativo: true,
      dataCadastro: new Date(),
    });
    const produto = new Produto({
      id: 'uuid-prod-2',
      nome: 'Mouse Gamer',
      descricao: 'desc',
      preco: Money.of(200),
      categoria: cat,
      ativo: true,
      dataCadastro: new Date(),
    });
    (cat as unknown as { id: unknown }).id = '5';
    repo.findByIdOrThrow.mockResolvedValue(produto);

    const result = await query.executar('uuid-prod-2');

    expect(result.categoriaId).toBe(5);
    expect(typeof result.categoriaId).toBe('number');
    expect(result.categoriaNome).toBe('Periféricos');
  });

  it('delegates to repo.findByIdOrThrow with the correct id', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Produto({ id: 'uuid-abc', nome: 'Test', descricao: 'd', preco: Money.of(1), categoria: null, ativo: true, dataCadastro: new Date() }),
    );

    await query.executar('uuid-abc');

    expect(repo.findByIdOrThrow).toHaveBeenCalledWith('uuid-abc');
  });

  it('returns cached value on cache hit without calling the repo', async () => {
    const cached = { id: 'uuid-prod-1', nome: 'Cached' };
    cache.get.mockResolvedValue(cached);

    const result = await query.executar('uuid-prod-1');

    expect(result).toBe(cached);
    expect(repo.findByIdOrThrow).not.toHaveBeenCalled();
  });

  it('stores result in cache on cache miss', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Produto({ id: 'uuid-prod-1', nome: 'Notebook', descricao: 'd', preco: Money.of(1), categoria: null, ativo: true, dataCadastro: new Date() }),
    );

    await query.executar('uuid-prod-1');

    expect(cache.set).toHaveBeenCalledWith(
      CACHE_KEYS.PRODUTO_BY_ID('uuid-prod-1'),
      expect.any(Object),
      expect.any(Number),
    );
  });
});
