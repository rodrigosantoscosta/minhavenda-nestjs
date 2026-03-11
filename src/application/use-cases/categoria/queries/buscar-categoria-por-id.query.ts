import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { CategoriaMapper } from '@app/mappers/categoria.mapper';

@Injectable()
export class BuscarCategoriaPorIdQuery {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
  ) {}

  async executar(id: number): Promise<CategoriaDto> {
    const categoria = await this.categoriaRepo.findByIdOrThrow(id);
    return CategoriaMapper.toDto(categoria);
  }
}
