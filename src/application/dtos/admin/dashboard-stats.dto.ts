import { ApiProperty } from '@nestjs/swagger';
import { StatusPedido } from '@domain/enums/status-pedido.enum';

export class EstoqueBaixoItem {
  @ApiProperty() produtoId!: string;
  @ApiProperty() nome!: string;
  @ApiProperty() quantidade!: number;
}

export class DashboardStatsDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  pedidosPorStatus!: Record<StatusPedido, number>;

  @ApiProperty() totalProdutosAtivos!: number;
  @ApiProperty() totalProdutosInativos!: number;
  @ApiProperty() totalUsuarios!: number;

  @ApiProperty({ type: [EstoqueBaixoItem] })
  estoqueBaixo!: EstoqueBaixoItem[];

  @ApiProperty() receitaTotal!: number;
}
