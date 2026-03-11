import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AtualizarCategoriaDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @IsOptional()
  descricao?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
