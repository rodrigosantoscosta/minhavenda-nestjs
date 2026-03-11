import { LimparCarrinhoUseCase } from './limpar-carrinho.use-case';
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

// ─── Mocks ───────────────────────────────────────────────────────────────────

const makeCarrinhoRepo = (): jest.Mocked<ICarrinhoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAtivoByUsuarioId: jest.fn(),
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

function makeProduto(id: string): Produto {
  return new Produto({
    id,
    nome: `Produto ${id}`,
    descricao: 'desc',
    preco: Money.of(100),
    categoria: null,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeCarrinhoComItens(count = 2): Carrinho {
  const carrinho = new Carrinho({
    id: 'cart-1',
    usuario: makeUsuario(),
    status: StatusCarrinho.ATIVO,
    itens: [],
    valorTotal: 100 * count,
    quantidadeTotal: count,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  });

  for (let i = 0; i < count; i++) {
    const produto = makeProduto(`prod-${i}`);
    carrinho.itens.push(
      new ItemCarrinho({
        id: `item-${i}`,
        carrinho,
        produto,
        quantidade: 1,
        precoUnitario: 100,
        subtotal: 100,
      }),
    );
  }
  return carrinho;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LimparCarrinhoUseCase', () => {
  let useCase: LimparCarrinhoUseCase;
  let carrinhoRepo: jest.Mocked<ICarrinhoRepository>;

  beforeEach(() => {
    carrinhoRepo = makeCarrinhoRepo();
    useCase = new LimparCarrinhoUseCase(carrinhoRepo);
  });

  it('throws BusinessException when no active cart exists', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(null);

    await expect(useCase.executar('user-1')).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(carrinhoRepo.save).not.toHaveBeenCalled();
  });

  it('empties itens array', async () => {
    const carrinho = makeCarrinhoComItens(3);
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.save.mockImplementation(async (c) => c);

    await useCase.executar('user-1');

    expect(carrinho.itens).toHaveLength(0);
  });

  it('resets valorTotal and quantidadeTotal to zero', async () => {
    const carrinho = makeCarrinhoComItens(2);
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.save.mockImplementation(async (c) => c);

    await useCase.executar('user-1');

    expect(Number(carrinho.valorTotal)).toBe(0);
    expect(carrinho.quantidadeTotal).toBe(0);
  });

  it('does not throw when cart is already empty', async () => {
    const carrinho = makeCarrinhoComItens(0);
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.save.mockImplementation(async (c) => c);

    await expect(useCase.executar('user-1')).resolves.not.toThrow();
    expect(carrinhoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('saves and returns a CarrinhoDto with empty itens list', async () => {
    const carrinho = makeCarrinhoComItens(2);
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    carrinhoRepo.save.mockImplementation(async (c) => c);

    const result = await useCase.executar('user-1');

    expect(carrinhoRepo.save).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('cart-1');
    expect(result.itens).toHaveLength(0);
    expect(result.valorTotal).toBe(0);
  });
});
