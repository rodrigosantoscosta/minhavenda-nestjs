import { Inject, Injectable } from '@nestjs/common';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { RemoverEstoqueDto } from '@app/dtos/estoque/remover-estoque.dto';
import { EstoqueDto } from '@app/dtos/estoque/estoque.dto';
import { EstoqueMapper } from '@app/mappers/estoque.mapper';

@Injectable()
export class RemoverEstoqueUseCase {
  constructor(
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  /** Removes stock. The domain entity enforces that the result cannot go negative. */
  async executar(
    produtoId: string,
    dto: RemoverEstoqueDto,
  ): Promise<EstoqueDto> {
    const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(produtoId);
    estoque.remover(dto.quantidade);
    const saved = await this.estoqueRepo.save(estoque);
    return EstoqueMapper.toDto(saved);
  }
}
