import { CriarCategoriaUseCase } from './criar-categoria.use-case';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { Categoria } from '@domain/entities/categoria.entity';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS } from '@infra/cache/cache-keys.constant';

const makeRepo = (): jest.Mocked<ICategoriaRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

const makeCache = (): jest.Mocked<AppCacheService> =>
  ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined), delByPrefix: jest.fn() } as unknown as jest.Mocked<AppCacheService>);

function makeCategoria(id: number, nome: string): Categoria {
  return new Categoria({
    id,
    nome,
    descricao: 'desc',
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('CriarCategoriaUseCase', () => {
  let useCase: CriarCategoriaUseCase;
  let repo: jest.Mocked<ICategoriaRepository>;
  let cache: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    repo = makeRepo();
    cache = makeCache();
    useCase = new CriarCategoriaUseCase(repo, cache);
  });

  const dto = {
    nome: 'Eletrônicos',
    descricao: 'Produtos eletrônicos',
    ativo: true,
  };

  it('throws EntityAlreadyExistsException when nome already exists (exact match)', async () => {
    repo.findAll.mockResolvedValue([makeCategoria(1, 'Eletrônicos')]);

    await expect(useCase.executar(dto)).rejects.toBeInstanceOf(
      EntityAlreadyExistsException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws EntityAlreadyExistsException when nome already exists (case-insensitive)', async () => {
    repo.findAll.mockResolvedValue([makeCategoria(1, 'eletrônicos')]);

    await expect(
      useCase.executar({ ...dto, nome: 'ELETRÔNICOS' }),
    ).rejects.toBeInstanceOf(EntityAlreadyExistsException);
  });

  it('saves a new Categoria with trimmed nome and descricao', async () => {
    repo.findAll.mockResolvedValue([]);
    repo.save.mockImplementation(async (c) => c);

    await useCase.executar({
      ...dto,
      nome: '  Eletrônicos  ',
      descricao: '  desc  ',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.nome).toBe('Eletrônicos');
    expect(saved.descricao).toBe('desc');
  });

  it('defaults ativo to true when not provided', async () => {
    repo.findAll.mockResolvedValue([]);
    repo.save.mockImplementation(async (c) => c);

    await useCase.executar({ nome: 'Nova', descricao: 'desc' });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.ativo).toBe(true);
  });

  it('returns a CategoriaDto with id coerced to number', async () => {
    repo.findAll.mockResolvedValue([]);
    const saved = makeCategoria(5, dto.nome);
    (saved as unknown as { id: unknown }).id = '5';
    repo.save.mockResolvedValue(saved);

    const result: CategoriaDto = await useCase.executar(dto);

    expect(result.id).toBe(5);
    expect(typeof result.id).toBe('number');
    expect(result.nome).toBe('Eletrônicos');
  });

  it('invalidates CATEGORIAS_ALL cache after saving', async () => {
    repo.findAll.mockResolvedValue([]);
    repo.save.mockImplementation(async (c) => c);

    await useCase.executar(dto);

    expect(cache.del).toHaveBeenCalledWith(CACHE_KEYS.CATEGORIAS_ALL);
  });

  it('does not invalidate cache when save is never reached (duplicate nome)', async () => {
    repo.findAll.mockResolvedValue([makeCategoria(1, 'Eletrônicos')]);

    await expect(useCase.executar(dto)).rejects.toBeInstanceOf(EntityAlreadyExistsException);
    expect(cache.del).not.toHaveBeenCalled();
  });
});
