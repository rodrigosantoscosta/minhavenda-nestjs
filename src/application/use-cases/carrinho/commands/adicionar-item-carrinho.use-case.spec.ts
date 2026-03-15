import { AdicionarItemCarrinhoUseCase } from './adicionar-item-carrinho.use-case';
import { ICarrinhoRepository } from '@domain/repositories/icarrinho.repository';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { IEstoqueRepository } from '@domain/repositories/iestoque.repository';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import { Produto } from '@domain/entities/produto.entity';
import { Estoque } from '@domain/entities/estoque.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { Money } from '@domain/value-objects/money.value-object';
import { Email } from '@domain/value-objects/email.value-object';
import { BusinessException } from '@domain/exceptions/business.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const makeCarrinhoRepo = (): jest.Mocked<ICarrinhoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAtivoByUsuarioId: jest.fn(),
  save: jest.fn(),
});

const makeProdutoRepo = (): jest.Mocked<IProdutoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

const makeEstoqueRepo = (): jest.Mocked<IEstoqueRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByProdutoId: jest.fn(),
  findByProdutoIdOrThrow: jest.fn(),
  save: jest.fn(),
});

// ─── Factories ───────────────────────────────────────────────────────────────

function makeUsuario(id = 'user-1'): Usuario {
  return new Usuario({
    id,
    nome: 'Test',
    email: new Email('test@example.com'),
    senha: 'hash',
    tipo: TipoUsuario.CLIENTE,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeProduto(id = 'prod-1', preco = 100, ativo = true): Produto {
  return new Produto({
    id,
    nome: 'Produto Teste',
    descricao: 'desc',
    preco: Money.of(preco),
    categoria: null,
    ativo,
    dataCadastro: new Date(),
  });
}

function makeEstoque(produtoId: string, quantidade = 10): Estoque {
  const produto = makeProduto(produtoId);
  return new Estoque({ produto, quantidade, atualizadoEm: new Date() });
}

function makeCarrinho(id = 'cart-1', itens: ItemCarrinho[] = []): Carrinho {
  return new Carrinho({
    id,
    usuario: makeUsuario(),
    status: StatusCarrinho.ATIVO,
    itens,
    valorTotal: 0,
    quantidadeTotal: 0,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AdicionarItemCarrinhoUseCase', () => {
  let useCase: AdicionarItemCarrinhoUseCase;
  let carrinhoRepo: jest.Mocked<ICarrinhoRepository>;
  let produtoRepo: jest.Mocked<IProdutoRepository>;
  let estoqueRepo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    carrinhoRepo = makeCarrinhoRepo();
    produtoRepo = makeProdutoRepo();
    estoqueRepo = makeEstoqueRepo();
    useCase = new AdicionarItemCarrinhoUseCase(
      carrinhoRepo,
      produtoRepo,
      estoqueRepo,
    );
  });

  it('throws ResourceNotFoundException when produto does not exist', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(makeCarrinho());
    produtoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('Produto não encontrado'),
    );

    await expect(
      useCase.executar('user-1', { produtoId: 'prod-x', quantidade: 1 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws BusinessException when produto is inactive', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(makeCarrinho());
    produtoRepo.findByIdOrThrow.mockResolvedValue(
      makeProduto('prod-1', 100, false),
    );

    await expect(
      useCase.executar('user-1', { produtoId: 'prod-1', quantidade: 1 }),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('throws BusinessException when stock is insufficient (new item)', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(makeCarrinho());
    produtoRepo.findByIdOrThrow.mockResolvedValue(makeProduto('prod-1'));
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 2),
    );

    await expect(
      useCase.executar('user-1', { produtoId: 'prod-1', quantidade: 5 }),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('throws BusinessException when cart quantity + new quantity exceeds stock', async () => {
    // Cart already has 8 units of prod-1; stock is 10; requesting 5 more → 13 > 10
    const produto = makeProduto('prod-1');
    const carrinho = makeCarrinho();
    const itemExistente = new ItemCarrinho({
      id: 'item-1',
      carrinho,
      produto,
      quantidade: 8,
      precoUnitario: 100,
      subtotal: 800,
    });
    carrinho.itens.push(itemExistente);

    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    produtoRepo.findByIdOrThrow.mockResolvedValue(produto);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );

    await expect(
      useCase.executar('user-1', { produtoId: 'prod-1', quantidade: 5 }),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('creates a new cart when no active cart exists, then adds item', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(null);
    produtoRepo.findByIdOrThrow.mockResolvedValue(makeProduto('prod-1'));
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    // First save → creates empty cart; second save → cart with item
    const emptyCart = makeCarrinho();
    const cartWithItem = makeCarrinho();
    cartWithItem.itens = [
      new ItemCarrinho({
        id: 'item-new',
        carrinho: emptyCart,
        produto: makeProduto('prod-1'),
        quantidade: 2,
        precoUnitario: 100,
        subtotal: 200,
      }),
    ];
    cartWithItem.valorTotal = 200;
    cartWithItem.quantidadeTotal = 2;
    carrinhoRepo.save
      .mockResolvedValueOnce(emptyCart) // create cart
      .mockResolvedValueOnce(cartWithItem); // add item

    const result = await useCase.executar('user-1', {
      produtoId: 'prod-1',
      quantidade: 2,
    });

    expect(carrinhoRepo.save).toHaveBeenCalledTimes(2);
    expect(result.itens).toHaveLength(1);
  });

  it('merges into existing item when produto is already in cart', async () => {
    const produto = makeProduto('prod-1');
    const carrinho = makeCarrinho();
    const itemExistente = new ItemCarrinho({
      id: 'item-1',
      carrinho,
      produto,
      quantidade: 3,
      precoUnitario: 100,
      subtotal: 300,
    });
    carrinho.itens.push(itemExistente);

    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    produtoRepo.findByIdOrThrow.mockResolvedValue(produto);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    carrinhoRepo.save.mockImplementation(async (c) => c);

    await useCase.executar('user-1', { produtoId: 'prod-1', quantidade: 2 });

    // Merged: 3 + 2 = 5, still 1 item in cart
    expect(carrinho.itens).toHaveLength(1);
    expect(carrinho.itens[0].quantidade).toBe(5);
  });

  it('adds a new item entry when produto is not yet in cart', async () => {
    const produto = makeProduto('prod-1');
    const carrinho = makeCarrinho();

    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    produtoRepo.findByIdOrThrow.mockResolvedValue(produto);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    carrinhoRepo.save.mockImplementation(async (c) => c);

    await useCase.executar('user-1', { produtoId: 'prod-1', quantidade: 3 });

    expect(carrinho.itens).toHaveLength(1);
    expect(carrinho.itens[0].quantidade).toBe(3);
  });

  it('returns a CarrinhoDto after saving', async () => {
    const produto = makeProduto('prod-1', 50);
    const carrinho = makeCarrinho();
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    produtoRepo.findByIdOrThrow.mockResolvedValue(produto);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    carrinhoRepo.save.mockImplementation(async (c) => c);

    const result = await useCase.executar('user-1', {
      produtoId: 'prod-1',
      quantidade: 1,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('cart-1');
    expect(result.status).toBe(StatusCarrinho.ATIVO);
  });
});
