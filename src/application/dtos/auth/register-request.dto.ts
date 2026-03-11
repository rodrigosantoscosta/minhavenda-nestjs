import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome!: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  @IsEmail()
  @MaxLength(100)
  email!: string;

  /**
   * Min 8 chars: class-validator enforcement.
   * Max 72 chars: bcrypt silently truncates at 72 bytes — enforced here to make it explicit.
   */
  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  senha!: string;
}
