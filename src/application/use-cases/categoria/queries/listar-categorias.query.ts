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
export class ListarCategoriasQuery {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(): Promise<CategoriaDto[]> {
    const cached = await this.cacheService.get<CategoriaDto[]>(CACHE_KEYS.CATEGORIAS_ALL);
    if (cached) return cached;

    const categorias = await this.categoriaRepo.findAll();
    const dtos = CategoriaMapper.toDtoList(categorias);
    await this.cacheService.set(CACHE_KEYS.CATEGORIAS_ALL, dtos, CACHE_TTL.CATEGORIAS);
    return dtos;
  }
}
