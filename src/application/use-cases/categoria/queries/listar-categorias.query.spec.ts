import { ListarCategoriasQuery } from './listar-categorias.query';
import { ICategoriaRepository } from '@domain/repositories/icategoria.repository';
import { Categoria } from '@domain/entities/categoria.entity';

const makeRepo = (): jest.Mocked<ICategoriaRepository> => ({
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
});

function makeCategoria(id: number, nome: string): Categoria {
  return new Categoria({
    id,
    nome,
    descricao: `desc ${nome}`,
    ativo: true,
    dataCadastro: new Date(),
  });
}

describe('ListarCategoriasQuery', () => {
  let query: ListarCategoriasQuery;
  let repo: jest.Mocked<ICategoriaRepository>;

  beforeEach(() => {
    repo = makeRepo();
    query = new ListarCategoriasQuery(repo);
  });

  it('returns an empty array when there are no categorias', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await query.executar();

    expect(result).toEqual([]);
  });

  it('returns a mapped CategoriaDto list', async () => {
    repo.findAll.mockResolvedValue([
      makeCategoria(1, 'Eletrônicos'),
      makeCategoria(2, 'Roupas'),
    ]);

    const result = await query.executar();

    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe('Eletrônicos');
    expect(result[1].nome).toBe('Roupas');
  });

  it('coerces BIGSERIAL ids to number', async () => {
    const cat = makeCategoria(7, 'Casa');
    // Simulate PG driver returning id as string
    (cat as unknown as { id: unknown }).id = '7';
    repo.findAll.mockResolvedValue([cat]);

    const result = await query.executar();

    expect(result[0].id).toBe(7);
    expect(typeof result[0].id).toBe('number');
  });
});
