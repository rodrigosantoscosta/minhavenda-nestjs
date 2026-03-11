import { ApiProperty } from '@nestjs/swagger';

export class EstoqueDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  produtoId!: string;

  @ApiProperty()
  produtoNome!: string;

  @ApiProperty()
  quantidade!: number;

  @ApiProperty()
  atualizadoEm!: Date;
}
