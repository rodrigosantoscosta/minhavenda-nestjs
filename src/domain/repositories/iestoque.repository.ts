import { Estoque } from '../entities/estoque.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const IESTOQUE_REPOSITORY = Symbol('IEstoqueRepository');

export interface IEstoqueRepository {
  findById(id: number): Promise<Estoque | null>;

  findByIdOrThrow(id: number): Promise<Estoque>;

  findByProdutoId(produtoId: string): Promise<Estoque | null>;

  /** Convenience: throws ResourceNotFoundException when no stock record exists for the product */
  findByProdutoIdOrThrow(produtoId: string): Promise<Estoque>;

  save(estoque: Estoque): Promise<Estoque>;
}

export function assertEstoqueFound(
  estoque: Estoque | null,
  id: number,
): Estoque {
  if (!estoque) {
    throw new ResourceNotFoundException(`Estoque não encontrado: ${id}`);
  }

  return estoque;
}

export function assertEstoqueProdutoFound(
  estoque: Estoque | null,
  produtoId: string,
): Estoque {
  if (!estoque) {
    throw new ResourceNotFoundException(
      `Estoque não encontrado para o produto: ${produtoId}`,
    );
  }

  return estoque;
}
