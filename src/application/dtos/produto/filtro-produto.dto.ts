import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Query parameters for GET /api/produtos.
 * All filters are optional. When `ativo` is omitted, the repository defaults to true
 * (shows only active products).
 *
 * Pagination:
 *  - `page` (0-based) + `size` trigger paginated mode → returns PageDto<ProdutoDto>
 *  - `termo` is a generic search term (searches nome and descrição)
 *  - `sort` accepts "nome", "preco" or "criadoEm" (default: "nome")
 */
export class FiltroProdutoDto {
  /** Generic full-text search term (nome + descrição). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoMax?: number;

  /**
   * Accepts 'true' / 'false' as strings (query params are always strings).
   * class-transformer @Transform converts them to booleans.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  ativo?: boolean;

  /** 0-based page index. When provided together with `size`, enables pagination. */
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  /** Page size. When provided together with `page`, enables pagination. */
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  /** Sort field: "nome" | "preco" | "criadoEm". Defaults to "nome". */
  @ApiPropertyOptional({ enum: ['nome', 'preco', 'criadoEm'], default: 'nome' })
  @IsOptional()
  @IsString()
  sort?: string;
}
