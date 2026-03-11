import { Carrinho } from '../entities/carrinho.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const ICARRINHO_REPOSITORY = Symbol('ICarrinhoRepository');

export interface ICarrinhoRepository {
  findById(id: string): Promise<Carrinho | null>;

  findByIdOrThrow(id: string): Promise<Carrinho>;

  findAtivoByUsuarioId(usuarioId: string): Promise<Carrinho | null>;

  save(carrinho: Carrinho): Promise<Carrinho>;
}

export function assertCarrinhoFound(
  carrinho: Carrinho | null,
  id: string,
): Carrinho {
  if (!carrinho) {
    throw new ResourceNotFoundException(`Carrinho não encontrado: ${id}`);
  }

  return carrinho;
}
