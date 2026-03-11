import { Produto } from '../entities/produto.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const IPRODUTO_REPOSITORY = Symbol('IProdutoRepository');

export interface FiltrosProduto {
  nome?: string;
  categoriaId?: number;
  precoMin?: number;
  precoMax?: number;
  ativo?: boolean;
}

export interface IProdutoRepository {
  findById(id: string): Promise<Produto | null>;

  findByIdOrThrow(id: string): Promise<Produto>;

  findAll(filtros?: FiltrosProduto): Promise<Produto[]>;

  save(produto: Produto): Promise<Produto>;

  deleteById(id: string): Promise<void>;
}

export function assertProdutoFound(
  produto: Produto | null,
  id: string,
): Produto {
  if (!produto) {
    throw new ResourceNotFoundException(`Produto não encontrado: ${id}`);
  }

  return produto;
}
