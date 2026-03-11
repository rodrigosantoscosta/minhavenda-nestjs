import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { RolesGuard } from '@infra/security/roles.guard';
import { Roles } from '@infra/security/roles.decorator';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import {
  DlqRequeueService,
  VALID_DLQS,
} from '@infra/messaging/dlq-requeue.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin - DLQ')
@ApiBearerAuth('JWT')
@Controller('admin/dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
export class DlqAdminController {
  constructor(private readonly dlqRequeueService: DlqRequeueService) {}

  @Get('queues')
  @ApiOperation({ summary: 'Listar DLQs disponíveis (ADMIN)' })
  listarDlqs(): Record<string, unknown> {
    return {
      dlqs: VALID_DLQS,
      dica: 'Use POST /admin/dlq/requeue/{queue} para reprocessar mensagens de uma fila específica',
      managementUI: 'http://localhost:15672',
    };
  }

  @Post('requeue/:queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reprocessar mensagens de uma DLQ específica (ADMIN)',
  })
  async requeue(
    @Param('queue') queue: string,
  ): Promise<Record<string, unknown>> {
    try {
      const count = await this.dlqRequeueService.requeue(queue);
      return {
        dlq: queue,
        mensagensReenfileiradas: count,
        status:
          count > 0
            ? 'OK — mensagens reenviadas para reprocessamento'
            : 'DLQ estava vazia',
      };
    } catch (err) {
      return {
        erro: (err as Error).message,
        dlqsValidas: VALID_DLQS,
      };
    }
  }

  @Post('requeue-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprocessar mensagens de todas as DLQs (ADMIN)' })
  async requeueAll(): Promise<Record<string, unknown>> {
    const resultado = await this.dlqRequeueService.requeueAll();
    const total = Object.values(resultado).reduce((s, n) => s + n, 0);
    return {
      resultadoPorDlq: resultado,
      totalMensagensReenfileiradas: total,
      status: total > 0 ? 'OK' : 'Todas as DLQs estavam vazias',
    };
  }
}
