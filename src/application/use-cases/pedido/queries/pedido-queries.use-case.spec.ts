import { ListarMeusPedidosQuery } from './listar-meus-pedidos.query';
import { BuscarPedidoQuery } from './buscar-pedido.query';
import { IPedidoRepository } from '@domain/repositories/ipedido.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Pedido } from '@domain/entities/pedido.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import { Email } from '@domain/value-objects/email.value-object';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeUsuario(id = 'user-uuid-1'): Usuario {
  return new Usuario({
    id,
    nome: 'Maria Souza',
    email: new Email('maria@example.com'),
    senha: 'hash',
    tipo: TipoUsuario.CLIENTE,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makePedido(id = 'pedido-uuid-1', usuarioId = 'user-uuid-1'): Pedido {
  return new Pedido({
    id,
    usuario: makeUsuario(usuarioId),
    status: StatusPedido.CRIADO,
    subtotal: 150,
    valorFrete: 0,
    valorDesconto: 0,
    valorTotal: 150,
    quantidadeItens: 1,
    enderecoEntrega: 'Av. Paulista, 1000',
    observacoes: null,
    codigoRastreio: null,
    transportadora: null,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
    dataPagamento: null,
    dataEnvio: null,
    dataEntrega: null,
    itens: [],
    emailUsuario: 'maria@example.com',
    nomeUsuario: 'Maria Souza',
    telefoneUsuario: '',
  });
}

const makeRepo = (): jest.Mocked<IPedidoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByUsuarioId: jest.fn(),
  findAll: jest.fn(),
  findByStatus: jest.fn(),
  save: jest.fn(),
});

// ─── ListarMeusPedidosQuery ───────────────────────────────────────────────────

describe('ListarMeusPedidosQuery', () => {
  let query: ListarMeusPedidosQuery;
  let repo: jest.Mocked<IPedidoRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new ListarMeusPedidosQuery(repo);
  });

  it('returns an empty array when the user has no orders', async () => {
    repo.findByUsuarioId.mockResolvedValue([]);

    const result = await query.executar('user-uuid-1');

    expect(result).toEqual([]);
  });

  it('calls findByUsuarioId with the correct usuarioId', async () => {
    repo.findByUsuarioId.mockResolvedValue([makePedido()]);

    await query.executar('user-uuid-1');

    expect(repo.findByUsuarioId).toHaveBeenCalledWith('user-uuid-1');
  });

  it('returns one PedidoDto per pedido with correctly mapped fields', async () => {
    repo.findByUsuarioId.mockResolvedValue([
      makePedido('p-1'),
      makePedido('p-2'),
    ]);

    const result = await query.executar('user-uuid-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('p-1');
    expect(result[1].id).toBe('p-2');
    expect(result[0].status).toBe(StatusPedido.CRIADO);
    expect(typeof result[0].valorTotal).toBe('number');
  });

  it('coerces DECIMAL valorTotal from string to number', async () => {
    const pedido = makePedido();
    (pedido as unknown as { valorTotal: unknown }).valorTotal = '99.90';
    repo.findByUsuarioId.mockResolvedValue([pedido]);

    const result = await query.executar('user-uuid-1');

    expect(typeof result[0].valorTotal).toBe('number');
    expect(result[0].valorTotal).toBe(99.9);
  });
});

// ─── BuscarPedidoQuery ────────────────────────────────────────────────────────

describe('BuscarPedidoQuery', () => {
  let query: BuscarPedidoQuery;
  let repo: jest.Mocked<IPedidoRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new BuscarPedidoQuery(repo);
  });

  it('throws ResourceNotFoundException when pedido does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(
      query.executar('user-uuid-1', 'pedido-uuid-1'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws ResourceNotFoundException when pedido belongs to another user', async () => {
    const pedido = makePedido('pedido-uuid-1', 'user-uuid-1');
    repo.findByIdOrThrow.mockResolvedValue(pedido);

    await expect(
      query.executar('outro-user', 'pedido-uuid-1'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('returns PedidoDetalhadoDto with empty itens array when pedido has no items', async () => {
    const pedido = makePedido();
    repo.findByIdOrThrow.mockResolvedValue(pedido);

    const result = await query.executar('user-uuid-1', 'pedido-uuid-1');

    expect(result.id).toBe('pedido-uuid-1');
    expect(result.itens).toEqual([]);
  });

  it('returns PedidoDetalhadoDto with observacoes field included', async () => {
    const pedido = makePedido();
    (pedido as unknown as { observacoes: string | null }).observacoes =
      'Entregar pela manhã';
    repo.findByIdOrThrow.mockResolvedValue(pedido);

    const result = await query.executar('user-uuid-1', 'pedido-uuid-1');

    expect(result.observacoes).toBe('Entregar pela manhã');
  });
});
