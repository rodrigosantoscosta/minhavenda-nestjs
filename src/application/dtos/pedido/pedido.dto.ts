import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusPedido } from '@domain/enums/status-pedido.enum';

export class PedidoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: StatusPedido })
  status!: StatusPedido;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  valorFrete!: number;

  @ApiProperty()
  valorDesconto!: number;

  @ApiProperty()
  valorTotal!: number;

  @ApiProperty()
  quantidadeItens!: number;

  @ApiProperty()
  enderecoEntrega!: string;

  @ApiPropertyOptional({ nullable: true })
  codigoRastreio!: string | null;

  @ApiPropertyOptional({ nullable: true })
  transportadora!: string | null;

  @ApiProperty()
  dataCriacao!: Date;

  @ApiProperty()
  dataAtualizacao!: Date;

  @ApiPropertyOptional({ nullable: true })
  dataPagamento!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  dataEnvio!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  dataEntrega!: Date | null;
}
