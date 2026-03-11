import { Estoque } from '@domain/entities/estoque.entity';
import { EstoqueDto } from '../dtos/estoque/estoque.dto';

export class EstoqueMapper {
  static toDto(estoque: Estoque): EstoqueDto {
    const dto = new EstoqueDto();
    dto.id = Number(estoque.id); // BIGSERIAL returns as string from PG driver
    dto.produtoId = estoque.produto?.id ?? null;
    dto.produtoNome = estoque.produto?.nome ?? null;
    dto.quantidade = estoque.quantidade;
    dto.atualizadoEm = estoque.atualizadoEm;
    return dto;
  }
}
