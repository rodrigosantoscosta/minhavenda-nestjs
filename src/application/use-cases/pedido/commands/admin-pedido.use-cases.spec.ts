import { EnviarPedidoUseCase } from './enviar-pedido.use-case';
import { EntregarPedidoUseCase } from './entregar-pedido.use-case';
import { CancelarPedidoAdminUseCase } from './cancelar-pedido-admin.use-case';
import { PagarPedidoAdminUseCase } from './pagar-pedido-admin.use-case';
import { ListarTodosPedidosQuery } from '../queries/listar-todos-pedidos.query';
import { ListarPedidosPorStatusQuery } from '../queries/listar-pedidos-por-status.query';
import { BuscarPedidoAdminQuery } from '../queries/buscar-pedido-admin.query';
import { IPedidoRepository } from '@domain/repositories/ipedido.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { BusinessException } from '@domain/exceptions/business.exception';
import { Pedido } from '@domain/entities/pedido.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { Email } from '@domain/value-objects/email.value-object';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeUsuario(id = 'user-uuid-1'): Usuario {
  return new Usuario({
    id,
    nome: 'Admin User',
    email: new Email('admin@example.com'),
    senha: 'hash',
    tipo: TipoUsuario.ADMIN,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makePedido(
  id = 'pedido-uuid-1',
  status = StatusPedido.CRIADO,
): Pedido {
  const pedido = new Pedido({
    id,
    usuario: makeUsuario(),
    status,
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
    emailUsuario: 'admin@example.com',
    nomeUsuario: 'Admin User',
    telefoneUsuario: '',
  });
  return pedido;
}

// ─── Mock factory ─────────────────────────────────────────────────────────────

const makePedidoRepo = (): jest.Mocked<IPedidoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByUsuarioId: jest.fn(),
  findAll: jest.fn(),
  findByStatus: jest.fn(),
  save: jest.fn(),
});

const makeEventEmitter = () => ({ emit: jest.fn() });

// ─── EnviarPedidoUseCase ──────────────────────────────────────────────────────

describe('EnviarPedidoUseCase', () => {
  let useCase: EnviarPedidoUseCase;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    eventEmitter = makeEventEmitter();
    useCase = new EnviarPedidoUseCase(pedidoRepo, eventEmitter as never);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('pedido-1', {
        codigoRastreio: 'BR123',
        transportadora: 'Correios',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws BusinessException when pedido is not PAGO', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.CRIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('pedido-uuid-1', {
        codigoRastreio: 'BR123',
        transportadora: 'Correios',
      }),
    ).rejects.toBeInstanceOf(BusinessException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('marks pedido as ENVIADO with rastreio data and saves', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', {
      codigoRastreio: 'BR123456789BR',
      transportadora: 'Correios',
    });

    expect(pedido.status).toBe(StatusPedido.ENVIADO);
    expect(pedido.codigoRastreio).toBe('BR123456789BR');
    expect(pedido.transportadora).toBe('Correios');
    expect(pedidoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('emits PedidoEnviadoEvent after saving', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', {
      codigoRastreio: 'BR123',
      transportadora: 'Jadlog',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'PedidoEnviadoEvent',
      expect.any(Object),
    );
  });

  it('no ownership check — admin can ship any pedido', async () => {
    // Pedido belongs to a different user — admin should still be able to ship it
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await expect(
      useCase.executar('pedido-uuid-1', {
        codigoRastreio: 'BR123',
        transportadora: 'Correios',
      }),
    ).resolves.toBeDefined();
  });
});

// ─── EntregarPedidoUseCase ────────────────────────────────────────────────────

describe('EntregarPedidoUseCase', () => {
  let useCase: EntregarPedidoUseCase;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    useCase = new EntregarPedidoUseCase(pedidoRepo);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(useCase.executar('pedido-1')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('throws BusinessException when pedido is not ENVIADO', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(useCase.executar('pedido-uuid-1')).rejects.toBeInstanceOf(
      BusinessException,
    );
    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('marks pedido as ENTREGUE and saves', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.ENVIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1');

    expect(pedido.status).toBe(StatusPedido.ENTREGUE);
    expect(pedido.dataEntrega).not.toBeNull();
    expect(pedidoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('does not emit any domain event (no PedidoEntregueEvent in architecture)', async () => {
    // EntregarPedidoUseCase has no eventEmitter — this is intentional per architecture
    const pedido = makePedido('pedido-uuid-1', StatusPedido.ENVIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    const result = await useCase.executar('pedido-uuid-1');

    expect(result.status).toBe(StatusPedido.ENTREGUE);
  });
});

// ─── CancelarPedidoAdminUseCase ───────────────────────────────────────────────

describe('CancelarPedidoAdminUseCase', () => {
  let useCase: CancelarPedidoAdminUseCase;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    eventEmitter = makeEventEmitter();
    useCase = new CancelarPedidoAdminUseCase(pedidoRepo, eventEmitter as never);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('pedido-1', { motivo: 'fraude' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws BusinessException when pedido is in a non-cancellable status', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.ENTREGUE);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('pedido-uuid-1', { motivo: 'fraude' }),
    ).rejects.toBeInstanceOf(BusinessException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('cancels a CRIADO pedido and saves', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.CRIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', { motivo: 'fraude detectada' });

    expect(pedido.status).toBe(StatusPedido.CANCELADO);
    expect(pedidoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('cancels a PAGO pedido and saves (admin can cancel paid orders)', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', { motivo: 'estorno solicitado' });

    expect(pedido.status).toBe(StatusPedido.CANCELADO);
  });

  it('always emits PedidoCanceladoEvent — no ownership check bypasses event', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.CRIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', {
      motivo: 'cancelamento administrativo',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'PedidoCanceladoEvent',
      expect.any(Object),
    );
  });
});

// ─── PagarPedidoAdminUseCase ──────────────────────────────────────────────────

describe('PagarPedidoAdminUseCase', () => {
  let useCase: PagarPedidoAdminUseCase;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    eventEmitter = makeEventEmitter();
    useCase = new PagarPedidoAdminUseCase(pedidoRepo, eventEmitter as never);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      useCase.executar('pedido-1', { metodoPagamento: 'PIX' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws BusinessException when pedido is not CRIADO', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      useCase.executar('pedido-uuid-1', { metodoPagamento: 'PIX' }),
    ).rejects.toBeInstanceOf(BusinessException);

    expect(pedidoRepo.save).not.toHaveBeenCalled();
  });

  it('marks pedido as PAGO without ownership check and saves', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.CRIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', {
      metodoPagamento: 'TRANSFERENCIA',
      valorPago: 200,
    });

    expect(pedido.status).toBe(StatusPedido.PAGO);
    expect(pedidoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('emits PedidoPagoEvent after saving', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.CRIADO);
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);
    pedidoRepo.save.mockImplementation(async (p) => p);

    await useCase.executar('pedido-uuid-1', { metodoPagamento: 'PIX' });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'PedidoPagoEvent',
      expect.any(Object),
    );
  });
});

// ─── ListarTodosPedidosQuery ──────────────────────────────────────────────────

describe('ListarTodosPedidosQuery', () => {
  let query: ListarTodosPedidosQuery;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    query = new ListarTodosPedidosQuery(pedidoRepo);
  });

  it('returns empty array when no pedidos exist', async () => {
    pedidoRepo.findAll.mockResolvedValue([]);

    const result = await query.executar();

    expect(result).toEqual([]);
    expect(pedidoRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns mapped PedidoDto array for all pedidos', async () => {
    pedidoRepo.findAll.mockResolvedValue([
      makePedido('p-1', StatusPedido.CRIADO),
      makePedido('p-2', StatusPedido.PAGO),
    ]);

    const result = await query.executar();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('p-1');
    expect(result[1].status).toBe(StatusPedido.PAGO);
  });
});

// ─── ListarPedidosPorStatusQuery ──────────────────────────────────────────────

describe('ListarPedidosPorStatusQuery', () => {
  let query: ListarPedidosPorStatusQuery;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    query = new ListarPedidosPorStatusQuery(pedidoRepo);
  });

  it('delegates to findByStatus and returns mapped DTOs', async () => {
    pedidoRepo.findByStatus.mockResolvedValue([
      makePedido('p-1', StatusPedido.ENVIADO),
    ]);

    const result = await query.executar(StatusPedido.ENVIADO);

    expect(pedidoRepo.findByStatus).toHaveBeenCalledWith(StatusPedido.ENVIADO);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(StatusPedido.ENVIADO);
  });

  it('returns empty array when no pedidos match the status', async () => {
    pedidoRepo.findByStatus.mockResolvedValue([]);

    const result = await query.executar(StatusPedido.CANCELADO);

    expect(result).toEqual([]);
  });
});

// ─── BuscarPedidoAdminQuery ───────────────────────────────────────────────────

describe('BuscarPedidoAdminQuery', () => {
  let query: BuscarPedidoAdminQuery;
  let pedidoRepo: jest.Mocked<IPedidoRepository>;

  beforeEach(() => {
    pedidoRepo = makePedidoRepo();
    query = new BuscarPedidoAdminQuery(pedidoRepo);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    pedidoRepo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(query.executar('pedido-1')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('returns PedidoDetalhadoDto without ownership check', async () => {
    const pedido = makePedido('pedido-uuid-1', StatusPedido.PAGO);
    pedido.itens = [];
    pedidoRepo.findByIdOrThrow.mockResolvedValue(pedido);

    const result = await query.executar('pedido-uuid-1');

    expect(result.id).toBe('pedido-uuid-1');
    expect(result.status).toBe(StatusPedido.PAGO);
  });
});
