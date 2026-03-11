import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { RolesGuard } from '@infra/security/roles.guard';
import { Roles } from '@infra/security/roles.decorator';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import { PagarPedidoAdminUseCase } from '@app/use-cases/pedido/commands/pagar-pedido-admin.use-case';
import { EnviarPedidoUseCase } from '@app/use-cases/pedido/commands/enviar-pedido.use-case';
import { EntregarPedidoUseCase } from '@app/use-cases/pedido/commands/entregar-pedido.use-case';
import { CancelarPedidoAdminUseCase } from '@app/use-cases/pedido/commands/cancelar-pedido-admin.use-case';
import { ListarTodosPedidosQuery } from '@app/use-cases/pedido/queries/listar-todos-pedidos.query';
import { ListarPedidosPorStatusQuery } from '@app/use-cases/pedido/queries/listar-pedidos-por-status.query';
import { BuscarPedidoAdminQuery } from '@app/use-cases/pedido/queries/buscar-pedido-admin.query';
import { PagarPedidoDto } from '@app/dtos/pedido/pagar-pedido.dto';
import { EnviarPedidoDto } from '@app/dtos/pedido/enviar-pedido.dto';
import { CancelarPedidoDto } from '@app/dtos/pedido/cancelar-pedido.dto';
import { PedidoDto } from '@app/dtos/pedido/pedido.dto';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin - Pedidos')
@ApiBearerAuth('JWT')
@Controller('admin/pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
export class AdminPedidoController {
  constructor(
    private readonly pagarPedidoAdminUseCase: PagarPedidoAdminUseCase,
    private readonly enviarPedidoUseCase: EnviarPedidoUseCase,
    private readonly entregarPedidoUseCase: EntregarPedidoUseCase,
    private readonly cancelarPedidoAdminUseCase: CancelarPedidoAdminUseCase,
    private readonly listarTodosPedidosQuery: ListarTodosPedidosQuery,
    private readonly listarPedidosPorStatusQuery: ListarPedidosPorStatusQuery,
    private readonly buscarPedidoAdminQuery: BuscarPedidoAdminQuery,
  ) {}

  /** GET /api/admin/pedidos — ADMIN */
  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos', type: [PedidoDto] })
  listarTodos(): Promise<PedidoDto[]> {
    return this.listarTodosPedidosQuery.executar();
  }

  /** GET /api/admin/pedidos/status/:status — ADMIN */
  @Get('status/:status')
  @ApiOperation({ summary: 'Listar pedidos por status (ADMIN)' })
  @ApiParam({ name: 'status', enum: StatusPedido })
  @ApiResponse({ status: 200, description: 'Lista filtrada por status', type: [PedidoDto] })
  listarPorStatus(@Param('status') status: StatusPedido): Promise<PedidoDto[]> {
    return this.listarPedidosPorStatusQuery.executar(status);
  }

  /** GET /api/admin/pedidos/:id — ADMIN */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pedido detalhado', type: PedidoDetalhadoDto })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  buscar(@Param('id', ParseUUIDPipe) id: string): Promise<PedidoDetalhadoDto> {
    return this.buscarPedidoAdminQuery.executar(id);
  }

  /** POST /api/admin/pedidos/:id/pagar — ADMIN */
  @Post(':id/pagar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pedido como pago (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pedido marcado como pago', type: PedidoDetalhadoDto })
  @ApiResponse({ status: 422, description: 'Transição de status inválida' })
  pagar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PagarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    return this.pagarPedidoAdminUseCase.executar(id, dto);
  }

  /** POST /api/admin/pedidos/:id/enviar — ADMIN */
  @Post(':id/enviar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pedido como enviado com código de rastreio (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pedido enviado', type: PedidoDetalhadoDto })
  @ApiResponse({ status: 422, description: 'Transição de status inválida' })
  enviar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnviarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    return this.enviarPedidoUseCase.executar(id, dto);
  }

  /** POST /api/admin/pedidos/:id/entregar — ADMIN */
  @Post(':id/entregar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pedido como entregue (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pedido entregue', type: PedidoDetalhadoDto })
  @ApiResponse({ status: 422, description: 'Transição de status inválida' })
  entregar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PedidoDetalhadoDto> {
    return this.entregarPedidoUseCase.executar(id);
  }

  /** POST /api/admin/pedidos/:id/cancelar — ADMIN */
  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar pedido (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado', type: PedidoDetalhadoDto })
  @ApiResponse({ status: 422, description: 'Transição de status inválida' })
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    return this.cancelarPedidoAdminUseCase.executar(id, dto);
  }
}
