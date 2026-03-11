import { BuscarProdutoPorIdQuery } from './buscar-produto-por-id.query';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Produto } from '@domain/entities/produto.entity';
import { Categoria } from '@domain/entities/categoria.entity';
import { Money } from '@domain/value-objects/money.value-object';

const makeRepo = (): jest.Mocked<IProdutoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

describe('BuscarProdutoPorIdQuery', () => {
  let query: BuscarProdutoPorIdQuery;
  let repo: jest.Mocked<IProdutoRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new BuscarProdutoPorIdQuery(repo);
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
    expect(result.descricao).toBe('Switches Cherry MX Red');
    expect(result.preco).toBe(450);
    expect(result.moeda).toBe('BRL');
    expect(result.urlImagem).toBe('https://example.com/teclado.jpg');
    expect(result.pesoKg).toBeCloseTo(1.2);
    expect(result.alturaCm).toBe(4);
    expect(result.larguraCm).toBe(36);
    expect(result.comprimentoCm).toBe(14);
    expect(result.ativo).toBe(true);
    expect(result.dataCadastro).toEqual(dataCadastro);
    expect(result.categoriaId).toBeNull();
    expect(result.categoriaNome).toBeNull();
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
    // Simulate PG driver returning BIGSERIAL categoria.id as string
    (cat as unknown as { id: unknown }).id = '5';
    repo.findByIdOrThrow.mockResolvedValue(produto);

    const result = await query.executar('uuid-prod-2');

    expect(result.categoriaId).toBe(5);
    expect(typeof result.categoriaId).toBe('number');
    expect(result.categoriaNome).toBe('Periféricos');
  });

  it('delegates to repo.findByIdOrThrow with the correct id', async () => {
    repo.findByIdOrThrow.mockResolvedValue(
      new Produto({
        id: 'uuid-abc',
        nome: 'Test',
        descricao: 'd',
        preco: Money.of(1),
        categoria: null,
        ativo: true,
        dataCadastro: new Date(),
      }),
    );

    await query.executar('uuid-abc');

    expect(repo.findByIdOrThrow).toHaveBeenCalledWith('uuid-abc');
  });
});
