import { AtualizarProdutoUseCase } from './atualizar-produto.use-case';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
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
  findAllPaginated: jest.fn(),
});

const makeCatRepo = (): jest.Mocked<ICategoriaRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

function makeProduto(): Produto {
  const cat = new Categoria({
    id: 1,
    nome: 'Eletrônicos',
    descricao: 'd',
    ativo: true,
    dataCadastro: new Date(),
  });
  return new Produto({
    id: 'uuid-prod-1',
    nome: 'Notebook',
    descricao: 'desc original',
    preco: Money.of(3000),
    categoria: cat,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('AtualizarProdutoUseCase', () => {
  let useCase: AtualizarProdutoUseCase;
  let repo: jest.Mocked<IProdutoRepository>;
  let catRepo: jest.Mocked<ICategoriaRepository>;

  beforeEach(() => {
    repo = makeRepo();
    catRepo = makeCatRepo();
    useCase = new AtualizarProdutoUseCase(repo, catRepo);
  });

  it('throws ResourceNotFoundException when produto does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('unknown', { nome: 'X' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updates nome and trims whitespace', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto());
    repo.save.mockImplementation(async (p) => p);

    const result = await useCase.executar('uuid-prod-1', {
      nome: '  Notebook Pro  ',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.nome).toBe('Notebook Pro');
  });

  it('updates preco to a new Money VO', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto());
    repo.save.mockImplementation(async (p) => p);

    await useCase.executar('uuid-prod-1', { preco: 2500 });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.preco.valor.toNumber()).toBe(2500);
  });

  it('sets categoria to null when categoriaId is null', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto());
    repo.save.mockImplementation(async (p) => p);

    await useCase.executar('uuid-prod-1', { categoriaId: null });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.categoria).toBeNull();
    expect(catRepo.findByIdOrThrow).not.toHaveBeenCalled();
  });

  it('loads and assigns new categoria when categoriaId is provided', async () => {
    const novaCat = new Categoria({
      id: 2,
      nome: 'Livros',
      descricao: 'd',
      ativo: true,
      dataCadastro: new Date(),
    });
    repo.findByIdOrThrow.mockResolvedValue(makeProduto());
    catRepo.findByIdOrThrow.mockResolvedValue(novaCat);
    repo.save.mockImplementation(async (p) => p);

    await useCase.executar('uuid-prod-1', { categoriaId: 2 });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.categoria).toBe(novaCat);
  });

  it('throws ResourceNotFoundException when new categoriaId does not exist', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto());
    catRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('Categoria não encontrada'),
    );

    await expect(
      useCase.executar('uuid-prod-1', { categoriaId: 99 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('performs partial update — ignores undefined fields', async () => {
    const original = makeProduto();
    repo.findByIdOrThrow.mockResolvedValue(original);
    repo.save.mockImplementation(async (p) => p);

    // Only update ativo — nothing else should change
    await useCase.executar('uuid-prod-1', { ativo: false });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.nome).toBe('Notebook');
    expect(saved.descricao).toBe('desc original');
    expect(saved.ativo).toBe(false);
  });
});
