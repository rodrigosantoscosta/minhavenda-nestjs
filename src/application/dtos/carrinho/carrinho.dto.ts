import { ApiProperty } from '@nestjs/swagger';
import { ItemCarrinhoDto } from './item-carrinho.dto';

export class CarrinhoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  usuarioId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [ItemCarrinhoDto] })
  itens!: ItemCarrinhoDto[];

  @ApiProperty()
  valorTotal!: number;

  @ApiProperty()
  quantidadeTotal!: number;

  @ApiProperty()
  dataCriacao!: Date;

  @ApiProperty()
  dataAtualizacao!: Date;
}
