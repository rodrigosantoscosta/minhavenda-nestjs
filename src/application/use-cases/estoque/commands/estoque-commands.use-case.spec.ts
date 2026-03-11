import { AdicionarEstoqueUseCase } from './adicionar-estoque.use-case';
import { RemoverEstoqueUseCase } from './remover-estoque.use-case';
import { AjustarEstoqueUseCase } from './ajustar-estoque.use-case';
import { IEstoqueRepository } from '@domain/repositories/iestoque.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { BusinessException } from '@domain/exceptions/business.exception';
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
    nome: 'Smartphone',
    descricao: 'desc',
    preco: Money.of(999),
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeEstoque(quantidade: number, produtoId = 'prod-uuid-1'): Estoque {
  return new Estoque({
    id: 1,
    produto: makeProduto(produtoId),
    quantidade,
    atualizadoEm: new Date(),
  });
}

// ─── AdicionarEstoqueUseCase ────────────────────────────────────────────────

describe('AdicionarEstoqueUseCase', () => {
  let useCase: AdicionarEstoqueUseCase;
  let repo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new AdicionarEstoqueUseCase(repo);
  });

  it('throws ResourceNotFoundException when product has no stock record', async () => {
    repo.findByProdutoIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: 5 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('calls findByProdutoIdOrThrow with the correct produtoId', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque(10));
    repo.save.mockImplementation(async (e) => e);

    await useCase.executar('prod-uuid-1', { quantidade: 5 });

    expect(repo.findByProdutoIdOrThrow).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('increases the stock quantity and saves', async () => {
    const estoque = makeEstoque(10);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 5 });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.quantidade).toBe(15);
  });

  it('returns an EstoqueDto with correct produtoId and produtoNome', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque(10));
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 5 });

    expect(result.produtoId).toBe('prod-uuid-1');
    expect(result.produtoNome).toBe('Smartphone');
  });

  it('rejects zero quantity via the domain entity', async () => {
    const estoque = makeEstoque(10);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: 0 }),
    ).rejects.toBeInstanceOf(BusinessException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not call save when domain throws', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque(10));

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: -1 }),
    ).rejects.toBeInstanceOf(BusinessException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

// ─── RemoverEstoqueUseCase ──────────────────────────────────────────────────

describe('RemoverEstoqueUseCase', () => {
  let useCase: RemoverEstoqueUseCase;
  let repo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new RemoverEstoqueUseCase(repo);
  });

  it('throws ResourceNotFoundException when product has no stock record', async () => {
    repo.findByProdutoIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: 3 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('calls findByProdutoIdOrThrow with the correct produtoId', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque(20));
    repo.save.mockImplementation(async (e) => e);

    await useCase.executar('prod-uuid-1', { quantidade: 7 });

    expect(repo.findByProdutoIdOrThrow).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('decreases the stock quantity and saves', async () => {
    const estoque = makeEstoque(20);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 7 });

    expect(result.quantidade).toBe(13);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('throws BusinessException when removal exceeds available stock', async () => {
    const estoque = makeEstoque(5);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: 10 }),
    ).rejects.toBeInstanceOf(BusinessException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('allows removing exactly all stock (resulting in zero)', async () => {
    const estoque = makeEstoque(5);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 5 });

    expect(result.quantidade).toBe(0);
  });
});

// ─── AjustarEstoqueUseCase ──────────────────────────────────────────────────

describe('AjustarEstoqueUseCase', () => {
  let useCase: AjustarEstoqueUseCase;
  let repo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new AjustarEstoqueUseCase(repo);
  });

  it('throws ResourceNotFoundException when product has no stock record', async () => {
    repo.findByProdutoIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: 50 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('calls findByProdutoIdOrThrow with the correct produtoId', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque(100));
    repo.save.mockImplementation(async (e) => e);

    await useCase.executar('prod-uuid-1', { quantidade: 50 });

    expect(repo.findByProdutoIdOrThrow).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('sets stock to the absolute quantity provided', async () => {
    const estoque = makeEstoque(100);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 50 });

    expect(result.quantidade).toBe(50);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('can adjust stock to zero', async () => {
    const estoque = makeEstoque(30);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 0 });

    expect(result.quantidade).toBe(0);
  });

  it('throws BusinessException when negative quantity is given', async () => {
    const estoque = makeEstoque(10);
    repo.findByProdutoIdOrThrow.mockResolvedValue(estoque);

    await expect(
      useCase.executar('prod-uuid-1', { quantidade: -1 }),
    ).rejects.toBeInstanceOf(BusinessException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns dto with correct produtoId and produtoNome after adjustment', async () => {
    repo.findByProdutoIdOrThrow.mockResolvedValue(makeEstoque(10));
    repo.save.mockImplementation(async (e) => e);

    const result = await useCase.executar('prod-uuid-1', { quantidade: 25 });

    expect(result.produtoId).toBe('prod-uuid-1');
    expect(result.produtoNome).toBe('Smartphone');
    expect(result.quantidade).toBe(25);
  });
});
