import { ListarProdutosQuery } from './listar-produtos.query';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { Produto } from '@domain/entities/produto.entity';
import { Categoria } from '@domain/entities/categoria.entity';
import { Money } from '@domain/value-objects/money.value-object';

const makeRepo = (): jest.Mocked<IProdutoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
  findAllPaginated: jest.fn(),
});

function makeCategoria(): Categoria {
  return new Categoria({
    id: 1,
    nome: 'Eletrônicos',
    descricao: 'desc',
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeProduto(
  id: string,
  nome: string,
  cat: Categoria | null = null,
): Produto {
  return new Produto({
    id,
    nome,
    descricao: 'desc',
    preco: Money.of(100),
    categoria: cat,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('ListarProdutosQuery', () => {
  let query: ListarProdutosQuery;
  let repo: jest.Mocked<IProdutoRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new ListarProdutosQuery(repo);
  });

  it('returns an empty array when there are no produtos', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await query.executar();

    expect(result).toEqual([]);
  });

  it('passes undefined filtros to the repository when called with no args', async () => {
    repo.findAll.mockResolvedValue([]);

    await query.executar();

    expect(repo.findAll).toHaveBeenCalledWith(undefined);
  });

  it('passes filtros through to the repository unchanged', async () => {
    repo.findAll.mockResolvedValue([]);
    const filtros = {
      nome: 'Note',
      categoriaId: 1,
      precoMin: 100,
      precoMax: 5000,
      ativo: true,
    };

    await query.executar(filtros);

    expect(repo.findAll).toHaveBeenCalledWith(filtros);
  });

  it('returns mapped ProdutoDtos with preco as number', async () => {
    const cat = makeCategoria();
    repo.findAll.mockResolvedValue([
      makeProduto('uuid-1', 'Notebook', cat),
      makeProduto('uuid-2', 'Tablet', null),
    ]);

    const result = await query.executar();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('uuid-1');
    expect(result[0].nome).toBe('Notebook');
    expect(typeof result[0].preco).toBe('number');
    expect(result[0].categoriaId).toBe(1);
    expect(result[0].categoriaNome).toBe('Eletrônicos');
    expect(result[1].categoriaId).toBeNull();
    expect(result[1].categoriaNome).toBeNull();
  });

  it('returns a PageDto when page and size are provided', async () => {
    const cat = makeCategoria();
    const produtos = [makeProduto('uuid-1', 'Notebook', cat)];
    repo.findAllPaginated.mockResolvedValue({
      items: produtos,
      totalElements: 1,
    });

    const result = await query.executar({ page: 0, size: 10 });

    expect(repo.findAllPaginated).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect('content' in result).toBe(true);
    if ('content' in result) {
      expect(result.content).toHaveLength(1);
      expect(result.totalElements).toBe(1);
      expect(result.page).toBe(0);
      expect(result.size).toBe(10);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrevious).toBe(false);
    }
  });

  it('returns a flat array when page and size are absent', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await query.executar({ nome: 'Notebook' });

    expect(Array.isArray(result)).toBe(true);
    expect(repo.findAll).toHaveBeenCalled();
    expect(repo.findAllPaginated).not.toHaveBeenCalled();
  });

  it('maps preco.valor correctly to a plain number', async () => {
    const prod = new Produto({
      id: 'uuid-3',
      nome: 'Monitor',
      descricao: 'desc',
      preco: Money.of(1299.99),
      categoria: null,
      ativo: true,
      dataCadastro: new Date(),
    });
    repo.findAll.mockResolvedValue([prod]);

    const result = await query.executar();

    expect(result[0].preco).toBeCloseTo(1299.99);
  });
});
