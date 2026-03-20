import { AtualizarQuantidadeItemUseCase } from './atualizar-quantidade-item.use-case';
import { ICarrinhoRepository } from '@domain/repositories/icarrinho.repository';
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
  updateCarrinhoTotals: jest.fn(),
  saveItem: jest.fn(),
  removeItem: jest.fn(),
  clearItems: jest.fn(),
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

function makeUsuario(): Usuario {
  return new Usuario({
    id: 'user-1',
    nome: 'Test',
    email: new Email('test@example.com'),
    senha: 'hash',
    tipo: TipoUsuario.CLIENTE,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeProduto(id = 'prod-1'): Produto {
  return new Produto({
    id,
    nome: 'Produto',
    descricao: 'desc',
    preco: Money.of(200),
    categoria: null,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeEstoque(produtoId: string, quantidade = 10): Estoque {
  return new Estoque({
    produto: makeProduto(produtoId),
    quantidade,
    atualizadoEm: new Date(),
  });
}

function makeCarrinhoComItem(itemId = 'item-1', quantidade = 3): Carrinho {
  const carrinho = new Carrinho({
    id: 'cart-1',
    usuario: makeUsuario(),
    status: StatusCarrinho.ATIVO,
    itens: [],
    valorTotal: 0,
    quantidadeTotal: 0,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  });

  const produto = makeProduto('prod-1');
  const item = new ItemCarrinho({
    id: itemId,
    carrinho,
    produto,
    quantidade,
    precoUnitario: 200,
    subtotal: 200 * quantidade,
  });
  carrinho.itens.push(item);
  return carrinho;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AtualizarQuantidadeItemUseCase', () => {
  let useCase: AtualizarQuantidadeItemUseCase;
  let carrinhoRepo: jest.Mocked<ICarrinhoRepository>;
  let estoqueRepo: jest.Mocked<IEstoqueRepository>;

  beforeEach(() => {
    carrinhoRepo = makeCarrinhoRepo();
    estoqueRepo = makeEstoqueRepo();
    useCase = new AtualizarQuantidadeItemUseCase(carrinhoRepo, estoqueRepo);
  });

  it('throws BusinessException when no active cart exists', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(null);

    await expect(
      useCase.executar('user-1', 'item-1', { quantidade: 2 }),
    ).rejects.toBeInstanceOf(BusinessException);
    expect(estoqueRepo.findByProdutoIdOrThrow).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundException when item is not in cart', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(
      makeCarrinhoComItem('item-1'),
    );

    await expect(
      useCase.executar('user-1', 'item-nao-existe', { quantidade: 2 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(estoqueRepo.findByProdutoIdOrThrow).not.toHaveBeenCalled();
  });

  it('throws BusinessException when requested quantity exceeds stock', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(
      makeCarrinhoComItem('item-1', 3),
    );
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 5),
    );

    await expect(
      useCase.executar('user-1', 'item-1', { quantidade: 10 }),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('updates item quantity via domain method and recalculates subtotal', async () => {
    const carrinho = makeCarrinhoComItem('item-1', 3);
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    carrinhoRepo.saveItem.mockResolvedValue(undefined);
    carrinhoRepo.updateCarrinhoTotals.mockImplementation(async (c) => c);

    await useCase.executar('user-1', 'item-1', { quantidade: 5 });

    const item = carrinho.itens.find((i) => i.id === 'item-1')!;
    expect(item.quantidade).toBe(5);
    expect(item.subtotal).toBe(200 * 5);
  });

  it('recalculates cart totals after updating item', async () => {
    const carrinho = makeCarrinhoComItem('item-1', 1);
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    carrinhoRepo.saveItem.mockResolvedValue(undefined);
    carrinhoRepo.updateCarrinhoTotals.mockImplementation(async (c) => c);

    await useCase.executar('user-1', 'item-1', { quantidade: 4 });

    expect(Number(carrinho.valorTotal)).toBe(200 * 4);
    expect(carrinho.quantidadeTotal).toBe(4);
  });

  it('returns a CarrinhoDto after saving', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(
      makeCarrinhoComItem('item-1', 2),
    );
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque('prod-1', 10),
    );
    carrinhoRepo.saveItem.mockResolvedValue(undefined);
    carrinhoRepo.updateCarrinhoTotals.mockImplementation(async (c) => c);

    const result = await useCase.executar('user-1', 'item-1', {
      quantidade: 3,
    });

    expect(result.id).toBe('cart-1');
    expect(result.status).toBe(StatusCarrinho.ATIVO);
  });
});
