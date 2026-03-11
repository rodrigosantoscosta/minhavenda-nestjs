import { ApiProperty } from '@nestjs/swagger';

export class ItemPedidoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  produtoId!: string;

  @ApiProperty()
  produtoNome!: string;

  @ApiProperty()
  quantidade!: number;

  @ApiProperty()
  precoUnitario!: number;

  @ApiProperty()
  subtotal!: number;
}
