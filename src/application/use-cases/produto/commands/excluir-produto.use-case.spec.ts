import { ExcluirProdutoUseCase } from './excluir-produto.use-case';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Produto } from '@domain/entities/produto.entity';
import { Money } from '@domain/value-objects/money.value-object';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS, CACHE_PREFIXES } from '@infra/cache/cache-keys.constant';

const makeRepo = (): jest.Mocked<IProdutoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
  findAllPaginated: jest.fn(),
});

const makeCache = (): jest.Mocked<AppCacheService> =>
  ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined), delByPrefix: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AppCacheService>);

function makeProduto(id = 'uuid-prod-1'): Produto {
  return new Produto({ id, nome: 'Smartphone', descricao: 'desc', preco: Money.of(999), categoria: null, ativo: true, dataCadastro: new Date() });
}

describe('ExcluirProdutoUseCase', () => {
  let useCase: ExcluirProdutoUseCase;
  let repo: jest.Mocked<IProdutoRepository>;
  let cache: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    repo = makeRepo();
    cache = makeCache();
    useCase = new ExcluirProdutoUseCase(repo, cache);
  });

  it('throws ResourceNotFoundException when produto does not exist', async () => {
    repo.findByIdOrThrow.mockRejectedValue(
      new ResourceNotFoundException('não encontrado'),
    );

    await expect(useCase.executar('unknown-uuid')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('calls deleteById with the correct id on success', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto('uuid-prod-1'));
    repo.deleteById.mockResolvedValue();

    await useCase.executar('uuid-prod-1');

    expect(repo.deleteById).toHaveBeenCalledWith('uuid-prod-1');
    expect(repo.deleteById).toHaveBeenCalledTimes(1);
  });

  it('returns void on success', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto());
    repo.deleteById.mockResolvedValue();

    const result = await useCase.executar('uuid-prod-1');

    expect(result).toBeUndefined();
  });

  it('busts PRODUTO_BY_ID and produtos:lista: cache after deletion', async () => {
    repo.findByIdOrThrow.mockResolvedValue(makeProduto('uuid-prod-1'));
    repo.deleteById.mockResolvedValue();

    await useCase.executar('uuid-prod-1');

    expect(cache.del).toHaveBeenCalledWith(CACHE_KEYS.PRODUTO_BY_ID('uuid-prod-1'));
    expect(cache.delByPrefix).toHaveBeenCalledWith(CACHE_PREFIXES.PRODUTOS_LISTA);
  });

  it('does not bust cache when produto is not found', async () => {
    repo.findByIdOrThrow.mockRejectedValue(new ResourceNotFoundException('x'));

    await expect(useCase.executar('unknown-uuid')).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(cache.del).not.toHaveBeenCalled();
    expect(cache.delByPrefix).not.toHaveBeenCalled();
  });
});
