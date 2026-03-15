import { Inject, Injectable } from '@nestjs/common';
import {
  FiltrosProduto,
  FiltrosPaginados,
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { PageDto } from '@app/dtos/common/page.dto';
import { ProdutoMapper } from '@app/mappers/produto.mapper';

@Injectable()
export class ListarProdutosQuery {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
  ) {}

  /** Returns a flat list when no pagination params are provided. */
  async executar(filtros?: FiltrosProduto): Promise<ProdutoDto[]>;

  /** Returns a PageDto envelope when page + size are present. */
  async executar(
    filtros: FiltrosPaginados,
  ): Promise<PageDto<ProdutoDto>>;

  async executar(
    filtros?: FiltrosProduto | FiltrosPaginados,
  ): Promise<ProdutoDto[] | PageDto<ProdutoDto>> {
    if (isPaginado(filtros)) {
      const { items, totalElements } =
        await this.produtoRepo.findAllPaginated(filtros);
      return new PageDto({
        content: ProdutoMapper.toDtoList(items),
        totalElements,
        page: filtros.page,
        size: filtros.size,
      });
    }

    const produtos = await this.produtoRepo.findAll(filtros);
    return ProdutoMapper.toDtoList(produtos);
  }
}

function isPaginado(
  filtros?: FiltrosProduto | FiltrosPaginados,
): filtros is FiltrosPaginados {
  return (
    filtros !== undefined &&
    'page' in filtros &&
    filtros.page !== undefined &&
    'size' in filtros &&
    filtros.size !== undefined
  );
}
