import { Inject, Injectable } from '@nestjs/common';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { EstoqueDto } from '@app/dtos/estoque/estoque.dto';
import { EstoqueMapper } from '@app/mappers/estoque.mapper';

@Injectable()
export class ConsultarEstoqueQuery {
  constructor(
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  async executar(produtoId: string): Promise<EstoqueDto> {
    const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(produtoId);
    return EstoqueMapper.toDto(estoque);
  }
}
