import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AlterarSenhaRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  senhaAtual!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  novaSenha!: string;
}
