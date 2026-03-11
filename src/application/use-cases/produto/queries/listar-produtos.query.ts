import { Inject, Injectable } from '@nestjs/common';
import {
  FiltrosProduto,
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { ProdutoMapper } from '@app/mappers/produto.mapper';

@Injectable()
export class ListarProdutosQuery {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
  ) {}

  async executar(filtros?: FiltrosProduto): Promise<ProdutoDto[]> {
    const produtos = await this.produtoRepo.findAll(filtros);
    return ProdutoMapper.toDtoList(produtos);
  }
}
