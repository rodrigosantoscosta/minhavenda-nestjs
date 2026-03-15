import { CriarProdutoUseCase } from './criar-produto.use-case';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
import { IEstoqueRepository } from '@domain/repositories/iestoque.repository';
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

const makeEstoqueRepo = (): jest.Mocked<IEstoqueRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByProdutoId: jest.fn(),
  findByProdutoIdOrThrow: jest.fn(),
  save: jest.fn().mockImplementation(async (e) => e),
});

function makeCategoria(id: number): Categoria {
  return new Categoria({
    id,
    nome: 'Eletrônicos',
    descricao: 'desc',
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeProduto(): Produto {
  return new Produto({
    id: 'uuid-prod-1',
    nome: 'Smartphone',
    descricao: 'desc',
    preco: Money.of(999.9),
    categoria: null,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('CriarProdutoUseCase', () => {
  let useCase: CriarProdutoUseCase;
  let repo: jest.Mocked<IProdutoRepository>;
  let catRepo: jest.Mocked<ICategoriaRepository>;
  let estoqueRepo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    repo = makeRepo();
    catRepo = makeCatRepo();
    estoqueRepo = makeEstoqueRepo();
    useCase = new CriarProdutoUseCase(repo, catRepo, estoqueRepo);
  });

  const dto = {
    nome: '  Smartphone  ',
    descricao: '  Um bom smartphone  ',
    preco: 999.9,
    categoriaId: 1,
    ativo: true,
  };

  it('throws ResourceNotFoundException when categoriaId does not exist', async () => {
    catRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('Categoria não encontrada'),
    );

    await expect(useCase.executar(dto)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates produto with null categoria when categoriaId is not provided', async () => {
    const saved = makeProduto();
    repo.save.mockResolvedValue(saved);

    await useCase.executar({ nome: 'Produto', descricao: 'desc', preco: 10 });

    const created = repo.save.mock.calls[0][0];
    expect(created.categoria).toBeNull();
    expect(catRepo.findByIdOrThrow).not.toHaveBeenCalled();
  });

  it('loads and assigns categoria when categoriaId is provided', async () => {
    const cat = makeCategoria(1);
    catRepo.findByIdOrThrow.mockResolvedValue(cat);
    const saved = makeProduto();
    repo.save.mockResolvedValue(saved);

    await useCase.executar(dto);

    expect(catRepo.findByIdOrThrow).toHaveBeenCalledWith(1);
    const created = repo.save.mock.calls[0][0];
    expect(created.categoria).toBe(cat);
  });

  it('trims nome and descricao', async () => {
    catRepo.findByIdOrThrow.mockResolvedValue(makeCategoria(1));
    repo.save.mockResolvedValue(makeProduto());

    await useCase.executar(dto);

    const created = repo.save.mock.calls[0][0];
    expect(created.nome).toBe('Smartphone');
    expect(created.descricao).toBe('Um bom smartphone');
  });

  it('wraps preco in a Money VO', async () => {
    catRepo.findByIdOrThrow.mockResolvedValue(makeCategoria(1));
    repo.save.mockResolvedValue(makeProduto());

    await useCase.executar(dto);

    const created = repo.save.mock.calls[0][0];
    expect(created.preco).toBeInstanceOf(Money);
    expect(created.preco.valor.toNumber()).toBe(999.9);
  });

  it('defaults ativo to true when not provided', async () => {
    repo.save.mockResolvedValue(makeProduto());

    await useCase.executar({ nome: 'X', descricao: 'desc', preco: 1 });

    const created = repo.save.mock.calls[0][0];
    expect(created.ativo).toBe(true);
  });

  it('returns a ProdutoDto with correct preco as number', async () => {
    catRepo.findByIdOrThrow.mockResolvedValue(makeCategoria(1));
    const saved = makeProduto();
    repo.save.mockResolvedValue(saved);

    const result = await useCase.executar(dto);

    expect(typeof result.preco).toBe('number');
    expect(result.id).toBe('uuid-prod-1');
  });
});
