import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { CategoriaMapper } from '@app/mappers/categoria.mapper';

@Injectable()
export class ListarCategoriasQuery {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
  ) {}

  async executar(): Promise<CategoriaDto[]> {
    const categorias = await this.categoriaRepo.findAll();
    return CategoriaMapper.toDtoList(categorias);
  }
}
