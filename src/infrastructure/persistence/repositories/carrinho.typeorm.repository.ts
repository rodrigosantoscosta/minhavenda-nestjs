import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import {
  ICarrinhoRepository,
  assertCarrinhoFound,
} from '@domain/repositories/icarrinho.repository';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';

/** Relations always loaded to ensure domain methods and mappers work correctly. */
const RELATIONS = ['usuario', 'itens', 'itens.produto'];

@Injectable()
export class CarrinhoTypeOrmRepository implements ICarrinhoRepository {
  constructor(
    @InjectRepository(Carrinho)
    private readonly repo: Repository<Carrinho>,
    @InjectRepository(ItemCarrinho)
    private readonly itemRepo: Repository<ItemCarrinho>,
  ) {}

  async findById(id: string): Promise<Carrinho | null> {
    return this.repo.findOne({ where: { id }, relations: RELATIONS });
  }

  async findByIdOrThrow(id: string): Promise<Carrinho> {
    const carrinho = await this.findById(id);
    return assertCarrinhoFound(carrinho, id);
  }

  async findAtivoByUsuarioId(usuarioId: string): Promise<Carrinho | null> {
    return this.repo.findOne({
      where: { usuario: { id: usuarioId }, status: StatusCarrinho.ATIVO },
      relations: RELATIONS,
    });
  }

  /**
   * Full save — safe only for new Carrinho rows or adding a brand-new item
   * (the cascade INSERT is safe when the item has never been persisted before).
   */
  async save(carrinho: Carrinho): Promise<Carrinho> {
    const saved = await this.repo.save(carrinho);
    return this.findByIdOrThrow(saved.id);
  }

  /**
   * UPDATE only the scalar columns of the cart row — does NOT cascade into
   * itens_carrinho, which prevents TypeORM from nulling carrinho_id on
   * surviving items when it cannot determine insert vs update via @PrimaryColumn.
   */
  async updateCarrinhoTotals(carrinho: Carrinho): Promise<Carrinho> {
    await this.repo.update(carrinho.id, {
      valorTotal: carrinho.valorTotal,
      quantidadeTotal: carrinho.quantidadeTotal,
      dataAtualizacao: carrinho.dataAtualizacao,
    });
    return this.findByIdOrThrow(carrinho.id);
  }

  /** INSERT or UPDATE a single item row by its own PK. */
  async saveItem(item: ItemCarrinho): Promise<void> {
    await this.itemRepo.save(item);
  }

  /** DELETE a single item row by PK. */
  async removeItem(itemId: string): Promise<void> {
    await this.itemRepo.delete(itemId);
  }

  /** DELETE all item rows belonging to a cart. */
  async clearItems(carrinhoId: string): Promise<void> {
    await this.itemRepo.delete({ carrinho: { id: carrinhoId } });
  }
}
