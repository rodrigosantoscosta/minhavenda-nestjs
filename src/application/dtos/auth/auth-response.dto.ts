import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token — expira em curto prazo (ex: 15min/24h)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token — use em POST /auth/refresh para renovar' })
  refreshToken!: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  email!: string;

  @ApiProperty({ example: 'João Silva' })
  nome!: string;
}