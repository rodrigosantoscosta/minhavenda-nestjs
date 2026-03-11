import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutRequestDto {
  @ApiProperty({ example: 'Rua das Flores, 123, São Paulo - SP, 01310-100' })
  @IsNotEmpty({ message: 'Endereço de entrega é obrigatório' })
  @IsString()
  @MaxLength(500)
  enderecoEntrega!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefoneUsuario?: string;
}
