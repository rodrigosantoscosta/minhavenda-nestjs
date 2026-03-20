import { ObterOuCriarCarrinhoQuery } from './obter-ou-criar-carrinho.query';
import { ICarrinhoRepository } from '@domain/repositories/icarrinho.repository';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { Email } from '@domain/value-objects/email.value-object';

const makeRepo = (): jest.Mocked<ICarrinhoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAtivoByUsuarioId: jest.fn(),
  save: jest.fn(),
  updateCarrinhoTotals: jest.fn(),
  saveItem: jest.fn(),
  removeItem: jest.fn(),
  clearItems: jest.fn(),
});

function makeUsuario(id = 'user-uuid-1'): Usuario {
  return new Usuario({
    id,
    nome: 'João',
    email: new Email('joao@example.com'),
    senha: 'hash',
    tipo: TipoUsuario.CLIENTE,
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeCarrinho(usuarioId = 'user-uuid-1'): Carrinho {
  return new Carrinho({
    id: 'cart-uuid-1',
    usuario: makeUsuario(usuarioId),
    status: StatusCarrinho.ATIVO,
    itens: [],
    valorTotal: 0,
    quantidadeTotal: 0,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  });
}

describe('ObterOuCriarCarrinhoQuery', () => {
  let query: ObterOuCriarCarrinhoQuery;
  let repo: jest.Mocked<ICarrinhoRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new ObterOuCriarCarrinhoQuery(repo);
  });

  it('returns the existing active cart when one is found', async () => {
    const existing = makeCarrinho();
    repo.findAtivoByUsuarioId.mockResolvedValue(existing);

    const result = await query.executar('user-uuid-1');

    expect(result.id).toBe('cart-uuid-1');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates and saves a new cart when no active cart exists', async () => {
    repo.findAtivoByUsuarioId.mockResolvedValue(null);
    repo.save.mockImplementation(async (c) => c);

    const result = await query.executar('user-uuid-1');

    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.status).toBe(StatusCarrinho.ATIVO);
    expect(saved.itens).toEqual([]);
    expect(saved.valorTotal).toBe(0);
    expect(saved.quantidadeTotal).toBe(0);
  });

  it('creates new cart with a fresh UUID', async () => {
    repo.findAtivoByUsuarioId.mockResolvedValue(null);
    repo.save.mockImplementation(async (c) => c);

    await query.executar('user-uuid-1');

    const saved = repo.save.mock.calls[0][0];
    // UUID v4 format check
    expect(saved.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('returns a CarrinhoDto with usuarioId and status ATIVO', async () => {
    repo.findAtivoByUsuarioId.mockResolvedValue(null);
    const saved = makeCarrinho();
    repo.save.mockResolvedValue(saved);

    const result = await query.executar('user-uuid-1');

    expect(result.usuarioId).toBe('user-uuid-1');
    expect(result.status).toBe(StatusCarrinho.ATIVO);
    expect(result.itens).toEqual([]);
  });
});
