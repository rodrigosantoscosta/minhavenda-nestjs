import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS } from '@infra/cache/cache-keys.constant';

@Injectable()
export class ExcluirCategoriaUseCase {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(id: number): Promise<void> {
    // Confirm the categoria exists — throws ResourceNotFoundException if not
    await this.categoriaRepo.findByIdOrThrow(id);
    await this.categoriaRepo.deleteById(id);

    await Promise.all([
      this.cacheService.del(CACHE_KEYS.CATEGORIAS_ALL),
      this.cacheService.del(CACHE_KEYS.CATEGORIA_BY_ID(id)),
    ]);
  }
}
