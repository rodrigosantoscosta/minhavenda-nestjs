import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AjustarEstoqueDto {
  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Quantidade em estoque não pode ser negativa' })
  quantidade!: number;
}
