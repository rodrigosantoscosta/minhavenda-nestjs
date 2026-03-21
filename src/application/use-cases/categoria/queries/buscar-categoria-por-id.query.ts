import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { CategoriaMapper } from '@app/mappers/categoria.mapper';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '@infra/cache/cache-keys.constant';

@Injectable()
export class BuscarCategoriaPorIdQuery {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(id: number): Promise<CategoriaDto> {
    const key = CACHE_KEYS.CATEGORIA_BY_ID(id);
    const cached = await this.cacheService.get<CategoriaDto>(key);
    if (cached) return cached;

    const categoria = await this.categoriaRepo.findByIdOrThrow(id);
    const dto = CategoriaMapper.toDto(categoria);
    await this.cacheService.set(key, dto, CACHE_TTL.CATEGORIAS);
    return dto;
  }
}
