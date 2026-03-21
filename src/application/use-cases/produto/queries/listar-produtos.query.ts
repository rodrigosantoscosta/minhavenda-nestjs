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
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '@infra/cache/cache-keys.constant';

@Injectable()
export class ListarProdutosQuery {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  /** Returns a flat list when no pagination params are provided. */
  async executar(filtros?: FiltrosProduto): Promise<ProdutoDto[]>;

  /** Returns a PageDto envelope when page + size are present. */
  async executar(filtros: FiltrosPaginados): Promise<PageDto<ProdutoDto>>;

  async executar(
    filtros?: FiltrosProduto | FiltrosPaginados,
  ): Promise<ProdutoDto[] | PageDto<ProdutoDto>> {
    const cacheKey = CACHE_KEYS.PRODUTOS_LISTA(JSON.stringify(filtros ?? {}));

    if (isPaginado(filtros)) {
      const cached = await this.cacheService.get<PageDto<ProdutoDto>>(cacheKey);
      if (cached) return cached;

      const { items, totalElements } = await this.produtoRepo.findAllPaginated(filtros);
      const page = new PageDto({
        content: ProdutoMapper.toDtoList(items),
        totalElements,
        page: filtros.page,
        size: filtros.size,
      });
      await this.cacheService.set(cacheKey, page, CACHE_TTL.PRODUTOS);
      return page;
    }

    const cached = await this.cacheService.get<ProdutoDto[]>(cacheKey);
    if (cached) return cached;

    const produtos = await this.produtoRepo.findAll(filtros);
    const dtos = ProdutoMapper.toDtoList(produtos);
    await this.cacheService.set(cacheKey, dtos, CACHE_TTL.PRODUTOS);
    return dtos;
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
