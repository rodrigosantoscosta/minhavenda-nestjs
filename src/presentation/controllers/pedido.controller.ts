import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { CurrentUser } from '@infra/security/roles.decorator';
import type { AuthenticatedUser } from '@infra/security/jwt.strategy';
import { FinalizarCheckoutUseCase } from '@app/use-cases/pedido/commands/finalizar-checkout.use-case';
import { PagarPedidoUseCase } from '@app/use-cases/pedido/commands/pagar-pedido.use-case';
import { CancelarPedidoUseCase } from '@app/use-cases/pedido/commands/cancelar-pedido.use-case';
import { ListarMeusPedidosQuery } from '@app/use-cases/pedido/queries/listar-meus-pedidos.query';
import { BuscarPedidoQuery } from '@app/use-cases/pedido/queries/buscar-pedido.query';
import { CheckoutRequestDto } from '@app/dtos/pedido/checkout-request.dto';
import { PagarPedidoDto } from '@app/dtos/pedido/pagar-pedido.dto';
import { CancelarPedidoDto } from '@app/dtos/pedido/cancelar-pedido.dto';
import { PedidoDto } from '@app/dtos/pedido/pedido.dto';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SseRegistry } from '@infra/sse/sse.registry';

@ApiTags('Pedidos')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard)
export class PedidoController {
  constructor(
    private readonly finalizarCheckoutUseCase: FinalizarCheckoutUseCase,
    private readonly pagarPedidoUseCase: PagarPedidoUseCase,
    private readonly cancelarPedidoUseCase: CancelarPedidoUseCase,
    private readonly listarMeusPedidosQuery: ListarMeusPedidosQuery,
    private readonly buscarPedidoQuery: BuscarPedidoQuery,
    private readonly sseRegistry: SseRegistry,
  ) {}

  @Sse('pedidos/stream')
  @ApiOperation({ summary: 'Stream SSE de eventos de pedidos (autenticado)' })
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.sseRegistry.register(user.id);
  }

  @Post('checkout/finalizar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Finalizar checkout e criar pedido' })
  @ApiResponse({ status: 201, type: PedidoDetalhadoDto })
  finalizarCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutRequestDto,
  ): Promise<PedidoDetalhadoDto> {
    return this.finalizarCheckoutUseCase.executar(user.id, dto);
  }

  @Get('meus-pedidos')
  @ApiOperation({ summary: 'Listar pedidos do usuário autenticado' })
  @ApiResponse({ status: 200, type: [PedidoDto] })
  listarMeusPedidos(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PedidoDto[]> {
    return this.listarMeusPedidosQuery.executar(user.id);
  }

  @Get('pedidos/:id')
  @ApiOperation({ summary: 'Buscar pedido por ID (ownership verificado)' })
  @ApiResponse({ status: 200, type: PedidoDetalhadoDto })
  buscarPedido(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PedidoDetalhadoDto> {
    return this.buscarPedidoQuery.executar(user.id, id);
  }

  @Post('pedidos/:id/pagar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pagar pedido (cliente)' })
  @ApiResponse({ status: 200, type: PedidoDetalhadoDto })
  pagarPedido(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PagarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    return this.pagarPedidoUseCase.executar(user.id, id, dto);
  }

  @Post('pedidos/:id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar pedido (cliente)' })
  @ApiResponse({ status: 200, type: PedidoDetalhadoDto })
  cancelarPedido(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarPedidoDto,
  ): Promise<PedidoDetalhadoDto> {
    return this.cancelarPedidoUseCase.executar(user.id, id, dto);
  }
}
