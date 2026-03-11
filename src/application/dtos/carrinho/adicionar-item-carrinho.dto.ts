import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdicionarItemCarrinhoDto {
  @ApiProperty()
  @IsUUID()
  produtoId!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  quantidade!: number;
}
