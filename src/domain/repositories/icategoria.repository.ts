import { Categoria } from '../entities/categoria.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const ICATEGORIA_REPOSITORY = Symbol('ICategoriaRepository');

export interface ICategoriaRepository {
  findById(id: number): Promise<Categoria | null>;

  findByIdOrThrow(id: number): Promise<Categoria>;

  findAll(): Promise<Categoria[]>;

  save(categoria: Categoria): Promise<Categoria>;

  deleteById(id: number): Promise<void>;
}

export function assertCategoriaFound(
  categoria: Categoria | null,
  id: number,
): Categoria {
  if (!categoria) {
    throw new ResourceNotFoundException(`Categoria não encontrada: ${id}`);
  }

  return categoria;
}
