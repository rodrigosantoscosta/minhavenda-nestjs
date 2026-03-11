import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';
import { AtualizarCategoriaDto } from '@app/dtos/categoria/atualizar-categoria.dto';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';
import { CategoriaMapper } from '@app/mappers/categoria.mapper';

@Injectable()
export class AtualizarCategoriaUseCase {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
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
    return CategoriaMapper.toDto(updated);
  }
}
