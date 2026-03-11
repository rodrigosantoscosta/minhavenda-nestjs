import { ConsultarEstoqueQuery } from './consultar-estoque.query';
import { IEstoqueRepository } from '@domain/repositories/iestoque.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Estoque } from '@domain/entities/estoque.entity';
import { Produto } from '@domain/entities/produto.entity';
import { Money } from '@domain/value-objects/money.value-object';

const makeRepo = (): jest.Mocked<IEstoqueRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByProdutoId: jest.fn(),
  findByProdutoIdOrThrow: jest.fn(),
  save: jest.fn(),
});

function makeProduto(id = 'prod-uuid-1'): Produto {
  return new Produto({
    id,
    nome: 'Notebook',
    descricao: 'desc',
    preco: Money.of(3000),
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeEstoque(produtoId = 'prod-uuid-1', quantidade = 10): Estoque {
  return new Estoque({
    produto: makeProduto(produtoId),
    quantidade,
    atualizadoEm: new Date(),
  });
}

describe('ConsultarEstoqueQuery', () => {
  let query: ConsultarEstoqueQuery;
  let repo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new ConsultarEstoqueQuery(repo);
  });

  it('throws ResourceNotFoundException when no stock record exists for the product', async () => {
    repo.findByProdutoIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(query.executar('unknown-uuid')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('calls findByProdutoIdOrThrow with the correct produtoId', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque('prod-uuid-1'));

    await query.executar('prod-uuid-1');

    expect(repo.findByProdutoIdOrThrow).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('returns an EstoqueDto with all fields mapped correctly', async () => {
    const atualizadoEm = new Date('2024-06-01T12:00:00Z');
    const estoque = new Estoque({
      produto: makeProduto('prod-uuid-1'),
      quantidade: 42,
      atualizadoEm,
    });
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);

    const result = await query.executar('prod-uuid-1');

    expect(result.produtoId).toBe('prod-uuid-1');
    expect(result.produtoNome).toBe('Notebook');
    expect(result.quantidade).toBe(42);
    expect(result.atualizadoEm).toEqual(atualizadoEm);
  });

  it('coerces BIGSERIAL id to number', async () => {
    const estoque = makeEstoque('prod-uuid-1', 5);
    // Simulate PG driver returning BIGSERIAL id as string
    (estoque as unknown as { id: unknown }).id = '7';
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);

    const result = await query.executar('prod-uuid-1');

    expect(typeof result.id).toBe('number');
    expect(result.id).toBe(7);
  });
});
