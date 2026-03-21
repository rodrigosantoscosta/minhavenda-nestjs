import { Inject, Injectable } from '@nestjs/common';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS, CACHE_PREFIXES } from '@infra/cache/cache-keys.constant';

@Injectable()
export class ExcluirProdutoUseCase {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(id: string): Promise<void> {
    // Confirm the produto exists — throws ResourceNotFoundException if not
    await this.produtoRepo.findByIdOrThrow(id);
    await this.produtoRepo.deleteById(id);

    await Promise.all([
      this.cacheService.del(CACHE_KEYS.PRODUTO_BY_ID(id)),
      this.cacheService.delByPrefix(CACHE_PREFIXES.PRODUTOS_LISTA),
    ]);
  }
}
