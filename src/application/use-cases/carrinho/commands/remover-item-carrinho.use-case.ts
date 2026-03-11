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

    // 3. Remove via domain method — filters the itens array
    //    TypeORM's orphanedRowAction:'delete' will delete the removed item from DB
    carrinho.removerItem(itemId);

    // 4. Persist
    const saved = await this.carrinhoRepo.save(carrinho);
    return CarrinhoMapper.toDto(saved);
  }
}
