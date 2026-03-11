import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProdutoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  descricao!: string;

  /** Price value in BRL as a plain number for easy JSON serialisation. */
  @ApiProperty()
  preco!: number;

  @ApiProperty({ example: 'BRL' })
  moeda!: string;

  @ApiPropertyOptional({ nullable: true })
  urlImagem!: string | null;

  @ApiPropertyOptional({ nullable: true })
  pesoKg!: number | null;

  @ApiPropertyOptional({ nullable: true })
  alturaCm!: number | null;

  @ApiPropertyOptional({ nullable: true })
  larguraCm!: number | null;

  @ApiPropertyOptional({ nullable: true })
  comprimentoCm!: number | null;

  @ApiPropertyOptional({ nullable: true })
  categoriaId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  categoriaNome!: string | null;

  @ApiProperty()
  ativo!: boolean;

  @ApiProperty()
  dataCadastro!: Date;
}
