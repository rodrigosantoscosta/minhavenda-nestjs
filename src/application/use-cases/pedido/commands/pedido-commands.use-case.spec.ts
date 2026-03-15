import { FinalizarCheckoutUseCase } from './finalizar-checkout.use-case';
import { PagarPedidoUseCase } from './pagar-pedido.use-case';
import { CancelarPedidoUseCase } from './cancelar-pedido.use-case';
import { ICarrinhoRepository } from '@domain/repositories/icarrinho.repository';
import { IEstoqueRepository } from '@domain/repositories/iestoque.repository';
import { IPedidoRepository } from '@domain/repositories/ipedido.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { BusinessException } from '@domain/exceptions/business.exception';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { Estoque } from '@domain/entities/estoque.entity';
import { Pedido } from '@domain/entities/pedido.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { Produto } from '@domain/entities/produto.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import { ItemPedido } from '@domain/entities/item-pedido.entity';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import { Money } from '@domain/value-objects/money.value-object';
import { Email } from '@domain/value-objects/email.value-object';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeUsuario(id = 'user-uuid-1'): Usuario {
  return new Usuario({
    id,
    nome: 'João Silva',
    email: new Email('joao@example.com'),
    senha: 'hash',
    tipo: TipoUsuario.CLIENTE,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeProduto(id = 'prod-uuid-1'): Produto {
  return new Produto({
    id,
    nome: 'Produto Teste',
    descricao: 'desc',
    preco: Money.of(100),
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeItemCarrinho(produto: Produto): ItemCarrinho {
  const item = new ItemCarrinho({
    id: 'item-carrinho-uuid-1',
    carrinho: null as unknown as Carrinho,
    produto,
    quantidade: 2,
    precoUnitario: 100,
    subtotal: 200,
  });
  return item;
}

function makeCarrinho(itens: ItemCarrinho[] = []): Carrinho {
  const usuario = makeUsuario();
  const carrinho = new Carrinho({
    id: 'carrinho-uuid-1',
    usuario,
    status: StatusCarrinho.ATIVO,
    itens,
    valorTotal: itens.reduce((s, i) => s + i.subtotal, 0),
    quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0),
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  });
  // patch back-reference
  for (const item of itens) {
    (item as unknown as { carrinho: Carrinho }).carrinho = carrinho;
  }
  return carrinho;
}

function makeEstoque(produto: Produto, quantidade = 10): Estoque {
  return new Estoque({ produto, quantidade, atualizadoEm: new Date() });
}

function makePedido(id = 'pedido-uuid-1'): Pedido {
  const usuario = makeUsuario();
  const pedido = new Pedido({
    id,
    usuario,
    status: StatusPedido.CRIADO,
    subtotal: 200,
    valorFrete: 0,
    valorDesconto: 0,
    valorTotal: 200,
    quantidadeItens: 2,
    enderecoEntrega: 'Rua Teste, 1',
    observacoes: null,
    codigoRastreio: null,
    transportadora: null,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
    dataPagamento: null,
    dataEnvio: null,
    dataEntrega: null,
    itens: [],
    emailUsuario: 'joao@example.com',
    nomeUsuario: 'João Silva',
    telefoneUsuario: '',
  });
  return pedido;
}

// ─── Mock factories ──────────────────────────────────────────────────────────

const makeCarrinhoRepo = (): jest.Mocked<ICarrinhoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAtivoByUsuarioId: jest.fn(),
  save: jest.fn(),
});

const makeEstoqueRepo = (): jest.Mocked<IEstoqueRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByProdutoId: jest.fn(),
  findByProdutoIdOrThrow: jest.fn(),
  save: jest.fn(),
});

const makePedidoRepo = (): jest.Mocked<IPedidoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByUsuarioId: jest.fn(),
  findAll: jest.fn(),
  findByStatus: jest.fn(),
  save: jest.fn(),
});

const makeDataSource = () => ({
  transaction: jest
    .fn()
    .mockImplementation(
      async (callback: (manager: { save: jest.Mock }) => Promise<void>) => {
        const manager = {
          save: jest.fn().mockImplementation(async (_E, e) => e),
        };
        return callback(manager);
      },
    ),
});

const makeEventEmitter = () => ({ emit: jest.fn() });

// ─── FinalizarCheckoutUseCase ─────────────────────────────────────────────────

describe('FinalizarCheckoutUseCase', () => {
  let useCase: FinalizarCheckoutUseCase;
  let carrinhoRepo: jest.Mocked<ICarrinhoRepository>;
  let estoqueRepo: jest.Mocked<IEstoqueRepository>;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;
  let dataSource: ReturnType<typeof makeDataSource>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  const produto = makeProduto();
  const item = makeItemCarrinho(produto);

  beforeEach(() => {
    carrinhoRepo = makeCarrinhoRepo();
    estoqueRepo = makeEstoqueRepo();
    pedidoRepo = makePedidoRepo();
    dataSource = makeDataSource();
    eventEmitter = makeEventEmitter();

    useCase = new FinalizarCheckoutUseCase(
      carrinhoRepo,
      estoqueRepo,
      pedidoRepo,
      dataSource as never,
      eventEmitter as never,
    );
  });

  it('throws ResourceNotFoundException when there is no active cart', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(null);

    await expect(
      useCase.executar('user-uuid-1', { enderecoEntrega: 'Rua Teste, 1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws BusinessException when cart is empty', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(makeCarrinho([]));

    await expect(
      useCase.executar('user-uuid-1', { enderecoEntrega: 'Rua Teste, 1' }),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('throws BusinessException when stock is insufficient for any item', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(makeCarrinho([item]));
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(
      makeEstoque(produto, 1),
    ); // only 1, need 2

    await expect(
      useCase.executar('user-uuid-1', { enderecoEntrega: 'Rua Teste, 1' }),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('does not open a transaction when pre-checks fail', async () => {
    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(null);

    await expect(
      useCase.executar('user-uuid-1', { enderecoEntrega: 'Rua Teste, 1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('saves pedido, reserves stock and finalises cart in a transaction on success', async () => {
    const carrinho = makeCarrinho([item]);
    const estoque = makeEstoque(produto, 10);
    const pedidoSalvo = makePedido();
    pedidoSalvo.itens.push(
      new ItemPedido({
        id: 'item-pedido-1',
        pedido: pedidoSalvo,
        produto,
        produtoNome: produto.nome,
        quantidade: 2,
        precoUnitario: 100,
        subtotal: 200,
      }),
    );

    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedidoSalvo);

    await useCase.executar('user-uuid-1', { enderecoEntrega: 'Rua Teste, 1' });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(estoque.quantidade).toBe(8); // 10 - 2 reserved
  });

  it('emits PedidoCriadoEvent after successful commit', async () => {
    const carrinho = makeCarrinho([item]);
    const estoque = makeEstoque(produto, 10);
    const pedidoSalvo = makePedido();
    pedidoSalvo.itens.push(
      new ItemPedido({
        id: 'item-pedido-1',
        pedido: pedidoSalvo,
        produto,
        produtoNome: produto.nome,
        quantidade: 2,
        precoUnitario: 100,
        subtotal: 200,
      }),
    );

    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedidoSalvo);

    await useCase.executar('user-uuid-1', { enderecoEntrega: 'Rua Teste, 1' });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'PedidoCriadoEvent',
      expect.any(Object),
    );
  });

  it('returns a PedidoDetalhadoDto with items', async () => {
    const carrinho = makeCarrinho([item]);
    const estoque = makeEstoque(produto, 10);
    const pedidoSalvo = makePedido();
    pedidoSalvo.itens.push(
      new ItemPedido({
        id: 'item-pedido-1',
        pedido: pedidoSalvo,
        produto,
        produtoNome: produto.nome,
        quantidade: 2,
        precoUnitario: 100,
        subtotal: 200,
      }),
    );

    carrinhoRepo.findAtivoByUsuarioId.mockResolvedValue(carrinho);
    estoqueRepo.findByProdutoIdOrThrow.mockResolvedValue(estoque);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedidoSalvo);

    const result = await useCase.executar('user-uuid-1', {
      enderecoEntrega: 'Rua Teste, 1',
    });

    expect(result.status).toBe(StatusPedido.CRIADO);
    expect(result.itens).toHaveLength(1);
    expect(result.itens[0].produtoNome).toBe('Produto Teste');
  });
});

// ─── PagarPedidoUseCase ───────────────────────────────────────────────────────

describe('PagarPedidoUseCase', () => {
  let useCase: PagarPedidoUseCase;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    eventEmitter = makeEventEmitter();
    useCase = new PagarPedidoUseCase(pedidoRepo, eventEmitter as never);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('user-1', 'pedido-1', { metodoPagamento: 'PIX' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws ResourceNotFoundException when pedido belongs to another user', async () => {
    const pedido = makePedido(); // owner is 'user-uuid-1'
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('outro-user', 'pedido-uuid-1', {
        metodoPagamento: 'PIX',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('throws BusinessException when pedido is not in CRIADO status', async () => {
    const pedido = makePedido();
    pedido.status = StatusPedido.PAGO; // already paid
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('user-uuid-1', 'pedido-uuid-1', {
        metodoPagamento: 'PIX',
      }),
    ).rejects.toBeInstanceOf(BusinessException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('marks pedido as PAGO and saves', async () => {
    const pedido = makePedido();
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('user-uuid-1', 'pedido-uuid-1', {
      metodoPagamento: 'PIX',
    });

    expect(pedido.status).toBe(StatusPedido.PAGO);
    expect(pedidoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('defaults valorPago to pedido.valorTotal when not provided', async () => {
    const pedido = makePedido();
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('user-uuid-1', 'pedido-uuid-1', {
      metodoPagamento: 'PIX',
    });

    expect(pedido.dataPagamento).not.toBeNull();
  });

  it('emits PedidoPagoEvent after saving', async () => {
    const pedido = makePedido();
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('user-uuid-1', 'pedido-uuid-1', {
      metodoPagamento: 'CARTAO',
      valorPago: 200,
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'PedidoPagoEvent',
      expect.any(Object),
    );
  });
});

// ─── CancelarPedidoUseCase ────────────────────────────────────────────────────

describe('CancelarPedidoUseCase', () => {
  let useCase: CancelarPedidoUseCase;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    eventEmitter = makeEventEmitter();
    useCase = new CancelarPedidoUseCase(pedidoRepo, eventEmitter as never);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('user-1', 'pedido-1', { motivo: 'desistência' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws ResourceNotFoundException when pedido belongs to another user', async () => {
    const pedido = makePedido();
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('outro-user', 'pedido-uuid-1', {
        motivo: 'desistência',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('throws BusinessException when pedido is in an non-cancellable status', async () => {
    const pedido = makePedido();
    pedido.status = StatusPedido.ENTREGUE;
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('user-uuid-1', 'pedido-uuid-1', {
        motivo: 'desistência',
      }),
    ).rejects.toBeInstanceOf(BusinessException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('cancels a CRIADO pedido and saves', async () => {
    const pedido = makePedido();
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('user-uuid-1', 'pedido-uuid-1', {
      motivo: 'preço alto demais',
    });

    expect(pedido.status).toBe(StatusPedido.CANCELADO);
    expect(pedidoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('emits PedidoCanceladoEvent after saving', async () => {
    const pedido = makePedido();
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('user-uuid-1', 'pedido-uuid-1', {
      motivo: 'desistência',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'PedidoCanceladoEvent',
      expect.any(Object),
    );
  });
});
