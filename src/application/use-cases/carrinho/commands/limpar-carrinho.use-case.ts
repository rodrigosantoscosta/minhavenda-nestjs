import { Inject, Injectable } from '@nestjs/common';
import {
  ICarrinhoRepository,
  ICARRINHO_REPOSITORY,
} from '@domain/repositories/icarrinho.repository';
import { BusinessException } from '@domain/exceptions/business.exception';
import { CarrinhoDto } from '@app/dtos/carrinho/carrinho.dto';
import { CarrinhoMapper } from '@app/mappers/carrinho.mapper';

@Injectable()
export class LimparCarrinhoUseCase {
  constructor(
    @Inject(ICARRINHO_REPOSITORY)
    private readonly carrinhoRepo: ICarrinhoRepository,
  ) {}

  async executar(usuarioId: string): Promise<CarrinhoDto> {
    // 1. Load active cart
    const carrinho = await this.carrinhoRepo.findAtivoByUsuarioId(usuarioId);
    if (!carrinho) {
      throw new BusinessException('Carrinho ativo não encontrado');
    }

    // 2. Clear all items — orphanedRowAction:'delete' will remove them from DB
    carrinho.itens = [];
    carrinho.calcularValorTotal();

    // 3. Persist
    const saved = await this.carrinhoRepo.save(carrinho);
    return CarrinhoMapper.toDto(saved);
  }
}
