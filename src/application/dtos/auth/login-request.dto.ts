import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'joao@exemplo.com' })
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  senha!: string;
}
