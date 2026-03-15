import { ExcluirProdutoUseCase } from './excluir-produto.use-case';
import { IProdutoRepository } from '@domain/repositories/iproduto.repository';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { Produto } from '@domain/entities/produto.entity';
import { Money } from '@domain/value-objects/money.value-object';

const makeRepo = (): jest.Mocked<IProdutoRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
  findAllPaginated: jest.fn(),
});

function makeProduto(id = 'uuid-prod-1'): Produto {
  return new Produto({
    id,
    nome: 'Smartphone',
    descricao: 'desc',
    preco: Money.of(999),
    categoria: null,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('ExcluirProdutoUseCase', () => {
  let useCase: ExcluirProdutoUseCase;
  let repo: jest.Mocked<IProdutoRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ExcluirProdutoUseCase(repo);
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
});
