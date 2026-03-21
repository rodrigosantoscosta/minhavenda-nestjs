import { Inject, Injectable } from '@nestjs/common';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { ProdutoMapper } from '@app/mappers/produto.mapper';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '@infra/cache/cache-keys.constant';

@Injectable()
export class BuscarProdutoPorIdQuery {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(id: string): Promise<ProdutoDto> {
    const key = CACHE_KEYS.PRODUTO_BY_ID(id);
    const cached = await this.cacheService.get<ProdutoDto>(key);
    if (cached) return cached;

    const produto = await this.produtoRepo.findByIdOrThrow(id);
    const dto = ProdutoMapper.toDto(produto);
    await this.cacheService.set(key, dto, CACHE_TTL.PRODUTOS);
    return dto;
  }
}
