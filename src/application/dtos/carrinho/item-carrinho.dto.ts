import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemCarrinhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  produtoId!: string;

  @ApiProperty()
  produtoNome!: string;

  @ApiPropertyOptional({ nullable: true })
  produtoUrlImagem!: string | null;

  @ApiProperty()
  quantidade!: number;

  @ApiProperty()
  precoUnitario!: number;

  @ApiProperty()
  subtotal!: number;
}
