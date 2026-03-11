import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PagarPedidoDto {
  @ApiProperty({ enum: ['CARTAO', 'PIX', 'BOLETO'], example: 'PIX' })
  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsIn(['CARTAO', 'PIX', 'BOLETO'], {
    message: 'Método de pagamento deve ser CARTAO, PIX ou BOLETO',
  })
  metodoPagamento!: string;

  @ApiPropertyOptional({
    description: 'Valor pago; padrão: valor total do pedido',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorPago?: number;
}
