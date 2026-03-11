import { Inject, Injectable } from '@nestjs/common';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { AjustarEstoqueDto } from '@app/dtos/estoque/ajustar-estoque.dto';
import { EstoqueDto } from '@app/dtos/estoque/estoque.dto';
import { EstoqueMapper } from '@app/mappers/estoque.mapper';

@Injectable()
export class AjustarEstoqueUseCase {
  constructor(
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  /** Sets stock to an absolute quantity. Useful for inventory corrections. */
  async executar(
    produtoId: string,
    dto: AjustarEstoqueDto,
  ): Promise<EstoqueDto> {
    const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(produtoId);
    estoque.ajustar(dto.quantidade);
    const saved = await this.estoqueRepo.save(estoque);
    return EstoqueMapper.toDto(saved);
  }
}
