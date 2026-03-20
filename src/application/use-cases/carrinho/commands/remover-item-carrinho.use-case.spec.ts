import { RemoverItemCarrinhoUseCase } from './remover-item-carrinho.use-case';
import { ICarrinhoRepository } from '@domain/repositories/icarrinho.repository';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import { Produto } from '@domain/entities/produto.entity';
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

function makeProduto(): Produto {
  return new Produto({
    id: 'prod-1',
    nome: 'Produto',
    descricao: 'desc',
    preco: Money.of(150),
    categoria: null,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeCarrinhoComItem(itemId = 'item-1'): Carrinho {
  const carrinho = new Carrinho({
    id: 'cart-1',
    usuario: makeUsuario(),
    status: StatusCarrinho.ATIVO,
    itens: [],
    valorTotal: 300,
    quantidadeTotal: 2,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  });
  const item = new ItemCarrinho({
    id: itemId,
    carrinho,
    produto: makeProduto(),
    quantidade: 2,
    precoUnitario: 150,
    subtotal: 300,
  });
  carrinho.itens.push(item);
  return carrinho;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RemoverItemCarrinhoUseCase', () => {
  let useCase: RemoverItemCarrinhoUseCase;
  let carrinhoRepo: jest.Mocked<ICarrinhoRepository>;

  beforeEach(() => {
    carrinhoRepo = makeCarrinhoRepo();
    useCase = new RemoverItemCarrinhoUseCase(carrinhoRepo);
  });

  it('throws BusinessException when no active cart exists', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(null);

    await expect(useCase.executar('user-1', 'item-1')).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(carrinhoRepo.removeItem).not.toHaveBeenCalled();
    expect(carrinhoRepo.updateCarrinhoTotals).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundException when item is not in cart', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(
      makeCarrinhoComItem('item-1'),
    );

    await expect(
      useCase.executar('user-1', 'item-nao-existe'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(carrinhoRepo.removeItem).not.toHaveBeenCalled();
    expect(carrinhoRepo.updateCarrinhoTotals).not.toHaveBeenCalled();
  });

  it('removes the item from the cart via domain method', async () => {
    const carrinho = makeCarrinhoComItem('item-1');
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.removeItem.mockResolvedValue(undefined);
    carrinhoRepo.updateCarrinhoTotals.mockImplementation(async (c) => c);

    await useCase.executar('user-1', 'item-1');

    expect(carrinho.itens).toHaveLength(0);
  });

  it('recalculates cart totals after removing item', async () => {
    const carrinho = makeCarrinhoComItem('item-1');
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.removeItem.mockResolvedValue(undefined);
    carrinhoRepo.updateCarrinhoTotals.mockImplementation(async (c) => c);

    await useCase.executar('user-1', 'item-1');

    expect(Number(carrinho.valorTotal)).toBe(0);
    expect(carrinho.quantidadeTotal).toBe(0);
  });

  it('saves the cart and returns a CarrinhoDto', async () => {
    const carrinho = makeCarrinhoComItem('item-1');
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.removeItem.mockResolvedValue(undefined);
    carrinhoRepo.updateCarrinhoTotals.mockImplementation(async (c) => c);

    const result = await useCase.executar('user-1', 'item-1');

    expect(carrinhoRepo.removeItem).toHaveBeenCalledWith('item-1');
    expect(carrinhoRepo.updateCarrinhoTotals).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('cart-1');
    expect(result.itens).toHaveLength(0);
  });
});
