import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Refresh token JWT obtido no login/register' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}