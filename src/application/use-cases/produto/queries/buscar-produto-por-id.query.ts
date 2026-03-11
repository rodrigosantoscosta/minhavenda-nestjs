import { Inject, Injectable } from '@nestjs/common';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { ProdutoMapper } from '@app/mappers/produto.mapper';

@Injectable()
export class BuscarProdutoPorIdQuery {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
  ) {}

  async executar(id: string): Promise<ProdutoDto> {
    const produto = await this.produtoRepo.findByIdOrThrow(id);
    return ProdutoMapper.toDto(produto);
  }
}
