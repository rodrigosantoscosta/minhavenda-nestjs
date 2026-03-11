import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelarPedidoDto {
  @ApiProperty({ example: 'Comprei por engano' })
  @IsNotEmpty({ message: 'Motivo do cancelamento é obrigatório' })
  @IsString()
  @MaxLength(500)
  motivo!: string;
}
