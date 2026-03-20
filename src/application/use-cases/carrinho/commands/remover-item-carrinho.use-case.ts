import { Inject, Injectable } from '@nestjs/common';
import {
  ICarrinhoRepository,
  ICARRINHO_REPOSITORY,
} from '@domain/repositories/icarrinho.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { CarrinhoDto } from '@app/dtos/carrinho/carrinho.dto';
import { CarrinhoMapper } from '@app/mappers/carrinho.mapper';

@Injectable()
export class RemoverItemCarrinhoUseCase {
  constructor(
    @Inject(ICARRINHO_REPOSITORY)
    private readonly carrinhoRepo: ICarrinhoRepository,
  ) {}

  async executar(usuarioId: string, itemId: string): Promise<CarrinhoDto> {
    // 1. Load active cart
    const carrinho = await this.carrinhoRepo.findAtivoByUsuarioId(usuarioId);
    if (!carrinho) {
      throw new BusinessException('Carrinho ativo não encontrado');
    }

    // 2. Validate item belongs to this cart
    const itemExiste = carrinho.itens.some((i) => i.id === itemId);
    if (!itemExiste) {
      throw new ResourceNotFoundException(
        `Item não encontrado no carrinho: ${itemId}`,
      );
    }

    // 3. DELETE the item row directly — no cascade, no null carrinho_id risk
    await this.carrinhoRepo.removeItem(itemId);

    // 4. Update in-memory totals
    carrinho.removerItem(itemId);

    // 5. UPDATE only the cart scalar columns — does not touch itens_carrinho
    const saved = await this.carrinhoRepo.updateCarrinhoTotals(carrinho);
    return CarrinhoMapper.toDto(saved);
  }
}
