import { Inject, Injectable } from '@nestjs/common';
import {
  ICarrinhoRepository,
  ICARRINHO_REPOSITORY,
} from '@domain/repositories/icarrinho.repository';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { AtualizarItemCarrinhoDto } from '@app/dtos/carrinho/atualizar-item-carrinho.dto';
import { CarrinhoDto } from '@app/dtos/carrinho/carrinho.dto';
import { CarrinhoMapper } from '@app/mappers/carrinho.mapper';

@Injectable()
export class AtualizarQuantidadeItemUseCase {
  constructor(
    @Inject(ICARRINHO_REPOSITORY)
    private readonly carrinhoRepo: ICarrinhoRepository,
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  async executar(
    usuarioId: string,
    itemId: string,
    dto: AtualizarItemCarrinhoDto,
  ): Promise<CarrinhoDto> {
    // 1. Load active cart
    const carrinho = await this.carrinhoRepo.findAtivoByUsuarioId(usuarioId);
    if (!carrinho) {
      throw new BusinessException('Carrinho ativo não encontrado');
    }

    // 2. Find item inside the already-loaded cart
    const item = carrinho.itens.find((i) => i.id === itemId);
    if (!item) {
      throw new ResourceNotFoundException(
        `Item não encontrado no carrinho: ${itemId}`,
      );
    }

    // 3. Validate stock against the new requested quantity
    const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(
      item.produto.id,
    );
    if (!estoque.temEstoqueSuficiente(dto.quantidade)) {
      throw new BusinessException(
        `Estoque insuficiente. Disponível: ${estoque.quantidade}`,
      );
    }

    // 4. Update via domain method — recalculates subtotal
    item.atualizarQuantidade(dto.quantidade);

    // 5. Recalculate cart totals
    carrinho.calcularValorTotal();

    // 6. Persist with cascade
    const saved = await this.carrinhoRepo.save(carrinho);
    return CarrinhoMapper.toDto(saved);
  }
}
