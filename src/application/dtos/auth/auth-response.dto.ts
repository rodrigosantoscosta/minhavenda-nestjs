import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Bearer token' })
  token!: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  email!: string;

  @ApiProperty({ example: 'João Silva' })
  nome!: string;
}
