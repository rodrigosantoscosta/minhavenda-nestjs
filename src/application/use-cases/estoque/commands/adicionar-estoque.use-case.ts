import { Inject, Injectable } from '@nestjs/common';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { AdicionarEstoqueDto } from '@app/dtos/estoque/adicionar-estoque.dto';
import { EstoqueDto } from '@app/dtos/estoque/estoque.dto';
import { EstoqueMapper } from '@app/mappers/estoque.mapper';

@Injectable()
export class AdicionarEstoqueUseCase {
  constructor(
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  async executar(
    produtoId: string,
    dto: AdicionarEstoqueDto,
  ): Promise<EstoqueDto> {
    const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(produtoId);
    estoque.adicionar(dto.quantidade);
    const saved = await this.estoqueRepo.save(estoque);
    return EstoqueMapper.toDto(saved);
  }
}
