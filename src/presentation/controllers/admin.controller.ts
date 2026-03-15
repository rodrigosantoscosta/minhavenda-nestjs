import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { RolesGuard } from '@infra/security/roles.guard';
import { Roles } from '@infra/security/roles.decorator';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { ObterDashboardStatsQuery } from '@app/use-cases/admin/obter-dashboard-stats.query';
import { ListarUsuariosQuery } from '@app/use-cases/admin/listar-usuarios.query';
import { AtivarUsuarioUseCase } from '@app/use-cases/admin/ativar-usuario.use-case';
import { DesativarUsuarioUseCase } from '@app/use-cases/admin/desativar-usuario.use-case';
import { DashboardStatsDto } from '@app/dtos/admin/dashboard-stats.dto';
import { UsuarioAdminDto } from '@app/dtos/admin/usuario-admin.dto';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth('JWT')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
export class AdminController {
  constructor(
    private readonly obterDashboardStatsQuery: ObterDashboardStatsQuery,
    private readonly listarUsuariosQuery: ListarUsuariosQuery,
    private readonly ativarUsuarioUseCase: AtivarUsuarioUseCase,
    private readonly desativarUsuarioUseCase: DesativarUsuarioUseCase,
  ) {}

  /** GET /api/admin/dashboard */
  @Get('dashboard')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estatísticas do sistema', type: DashboardStatsDto })
  obterDashboard(): Promise<DashboardStatsDto> {
    return this.obterDashboardStatsQuery.executar();
  }

  /** GET /api/admin/usuarios */
  @Get('usuarios')
  @ApiOperation({ summary: 'Listar todos os usuários (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de usuários', type: [UsuarioAdminDto] })
  listarUsuarios(): Promise<UsuarioAdminDto[]> {
    return this.listarUsuariosQuery.executar();
  }

  /** GET /api/admin/usuarios/:id */
  @Get('usuarios/:id')
  @ApiOperation({ summary: 'Buscar usuário por ID (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Dados do usuário', type: UsuarioAdminDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  buscarUsuario(@Param('id', ParseUUIDPipe) id: string): Promise<UsuarioAdminDto> {
    return this.listarUsuariosQuery.executarPorId(id);
  }

  /** POST /api/admin/usuarios/:id/ativar */
  @Post('usuarios/:id/ativar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar usuário (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Usuário ativado', type: UsuarioAdminDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  ativarUsuario(@Param('id', ParseUUIDPipe) id: string): Promise<UsuarioAdminDto> {
    return this.ativarUsuarioUseCase.executar(id);
  }

  /** POST /api/admin/usuarios/:id/desativar */
  @Post('usuarios/:id/desativar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar usuário (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Usuário desativado', type: UsuarioAdminDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 422, description: 'Último administrador ativo não pode ser desativado' })
  desativarUsuario(@Param('id', ParseUUIDPipe) id: string): Promise<UsuarioAdminDto> {
    return this.desativarUsuarioUseCase.executar(id);
  }
}
