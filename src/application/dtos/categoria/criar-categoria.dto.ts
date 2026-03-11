import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CriarCategoriaDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao!: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean = true;
}
