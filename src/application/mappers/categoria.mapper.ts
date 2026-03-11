import { Categoria } from '@domain/entities/categoria.entity';
import { CategoriaDto } from '../dtos/categoria/categoria.dto';

export class CategoriaMapper {
  static toDto(categoria: Categoria): CategoriaDto {
    const dto = new CategoriaDto();
    dto.id = Number(categoria.id); // TypeORM returns BIGSERIAL as string from PG driver
    dto.nome = categoria.nome;
    dto.descricao = categoria.descricao;
    dto.ativo = categoria.ativo;
    dto.dataCadastro = categoria.dataCadastro;
    return dto;
  }

  static toDtoList(categorias: Categoria[]): CategoriaDto[] {
    return categorias.map((c) => CategoriaMapper.toDto(c));
  }
}
