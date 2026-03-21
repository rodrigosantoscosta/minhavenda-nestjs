import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { AtualizarCategoriaDto } from '@app/dtos/categoria/atualizar-categoria.dto';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { CategoriaMapper } from '@app/mappers/categoria.mapper';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS } from '@infra/cache/cache-keys.constant';

@Injectable()
export class AtualizarCategoriaUseCase {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(
    id: number,
    dto: AtualizarCategoriaDto,
  ): Promise<CategoriaDto> {
    const categoria = await this.categoriaRepo.findByIdOrThrow(id);

    if (dto.nome !== undefined) {
      const novoNome = dto.nome.trim();
      if (novoNome.toLowerCase() !== categoria.nome.toLowerCase()) {
        const todas = await this.categoriaRepo.findAll();
        const nomeJaExiste = todas.some(
          (c) => c.id !== id && c.nome.toLowerCase() === novoNome.toLowerCase(),
        );
        if (nomeJaExiste) {
          throw new EntityAlreadyExistsException(
            `Categoria com nome '${novoNome}' já existe`,
          );
        }
      }
      categoria.nome = novoNome;
    }

    if (dto.descricao !== undefined) categoria.descricao = dto.descricao.trim();
    if (dto.ativo !== undefined) categoria.ativo = dto.ativo;

    const updated = await this.categoriaRepo.save(categoria);

    await Promise.all([
      this.cacheService.del(CACHE_KEYS.CATEGORIAS_ALL),
      this.cacheService.del(CACHE_KEYS.CATEGORIA_BY_ID(id)),
    ]);

    return CategoriaMapper.toDto(updated);
  }
}
