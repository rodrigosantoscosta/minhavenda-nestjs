import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EnviarPedidoDto {
  @ApiProperty({ example: 'BR123456789BR' })
  @IsNotEmpty({ message: 'Código de rastreio é obrigatório' })
  @IsString()
  @MaxLength(255)
  codigoRastreio!: string;

  @ApiProperty({ example: 'Correios' })
  @IsNotEmpty({ message: 'Transportadora é obrigatória' })
  @IsString()
  @MaxLength(100)
  transportadora!: string;
}
