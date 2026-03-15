import { ApiProperty } from '@nestjs/swagger';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';

export class UsuarioAdminDto {
  @ApiProperty() id!: string;
  @ApiProperty() nome!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: TipoUsuario }) tipo!: TipoUsuario;
  @ApiProperty() ativo!: boolean;
  @ApiProperty() dataCadastro!: Date;
}
