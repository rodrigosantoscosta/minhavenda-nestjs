import { Carrinho } from '../entities/carrinho.entity';
import { ItemCarrinho } from '../entities/item-carrinho.entity';
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

export const ICARRINHO_REPOSITORY = Symbol('ICarrinhoRepository');

export interface ICarrinhoRepository {
  findById(id: string): Promise<Carrinho | null>;

  findByIdOrThrow(id: string): Promise<Carrinho>;

  findAtivoByUsuarioId(usuarioId: string): Promise<Carrinho | null>;

  /**
   * Full save — used only when creating a new Carrinho (no items yet)
   * or when adding a brand-new item (cascade INSERT is safe then).
   */
  save(carrinho: Carrinho): Promise<Carrinho>;

  /**
   * UPDATE only the scalar columns of the cart row (valorTotal,
   * quantidadeTotal, dataAtualizacao). Does NOT touch itens_carrinho.
   * Use this after removerItem / clearItems / atualizarItem.
   */
  updateCarrinhoTotals(carrinho: Carrinho): Promise<Carrinho>;

  /** INSERT or UPDATE a single item row. Safe for existing items. */
  saveItem(item: ItemCarrinho): Promise<void>;

  /** DELETE a single item row by PK. */
  removeItem(itemId: string): Promise<void>;

  /** DELETE all item rows belonging to a cart. */
  clearItems(carrinhoId: string): Promise<void>;
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
