import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RemoverEstoqueDto {
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Quantidade a remover deve ser pelo menos 1' })
  quantidade!: number;
}
