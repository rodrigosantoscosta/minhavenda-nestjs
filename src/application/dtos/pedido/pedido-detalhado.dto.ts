import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PedidoDto } from './pedido.dto';
import { ItemPedidoDto } from './item-pedido.dto';

export class PedidoDetalhadoDto extends PedidoDto {
  @ApiPropertyOptional({ nullable: true })
  observacoes!: string | null;

  @ApiProperty({ type: [ItemPedidoDto] })
  itens!: ItemPedidoDto[];
}
