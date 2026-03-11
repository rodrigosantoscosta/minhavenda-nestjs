import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { Categoria } from '@domain/entities/categoria.entity';
import { CriarCategoriaDto } from '@app/dtos/categoria/criar-categoria.dto';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { CategoriaMapper } from '@app/mappers/categoria.mapper';

@Injectable()
export class CriarCategoriaUseCase {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
  ) {}

  async executar(dto: CriarCategoriaDto): Promise<CategoriaDto> {
    const todas = await this.categoriaRepo.findAll();
    const nomeJaExiste = todas.some(
      (c) => c.nome.toLowerCase() === dto.nome.trim().toLowerCase(),
    );
    if (nomeJaExiste) {
      throw new EntityAlreadyExistsException(
        `Categoria com nome '${dto.nome}' já existe`,
      );
    }

    const categoria = new Categoria({
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
      ativo: dto.ativo ?? true,
      dataCadastro: new Date(),
    });

    const saved = await this.categoriaRepo.save(categoria);
    return CategoriaMapper.toDto(saved);
  }
}
