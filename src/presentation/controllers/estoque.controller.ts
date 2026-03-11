import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { RolesGuard } from '@infra/security/roles.guard';
import { Roles } from '@infra/security/roles.decorator';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { ConsultarEstoqueQuery } from '@app/use-cases/estoque/queries/consultar-estoque.query';
import { AdicionarEstoqueUseCase } from '@app/use-cases/estoque/commands/adicionar-estoque.use-case';
import { RemoverEstoqueUseCase } from '@app/use-cases/estoque/commands/remover-estoque.use-case';
import { AjustarEstoqueUseCase } from '@app/use-cases/estoque/commands/ajustar-estoque.use-case';
import { AdicionarEstoqueDto } from '@app/dtos/estoque/adicionar-estoque.dto';
import { RemoverEstoqueDto } from '@app/dtos/estoque/remover-estoque.dto';
import { AjustarEstoqueDto } from '@app/dtos/estoque/ajustar-estoque.dto';
import { EstoqueDto } from '@app/dtos/estoque/estoque.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Estoque')
@ApiBearerAuth('JWT')
@Controller('estoque')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
export class EstoqueController {
  constructor(
    private readonly consultarEstoqueQuery: ConsultarEstoqueQuery,
    private readonly adicionarEstoqueUseCase: AdicionarEstoqueUseCase,
    private readonly removerEstoqueUseCase: RemoverEstoqueUseCase,
    private readonly ajustarEstoqueUseCase: AjustarEstoqueUseCase,
  ) {}

  @Get('produto/:produtoId')
  @ApiOperation({ summary: 'Consultar estoque de produto (ADMIN)' })
  @ApiResponse({ status: 200, type: EstoqueDto })
  consultar(
    @Param('produtoId', ParseUUIDPipe) produtoId: string,
  ): Promise<EstoqueDto> {
    return this.consultarEstoqueQuery.executar(produtoId);
  }

  @Post('produto/:produtoId/adicionar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar estoque (ADMIN)' })
  @ApiResponse({ status: 200, type: EstoqueDto })
  adicionar(
    @Param('produtoId', ParseUUIDPipe) produtoId: string,
    @Body() dto: AdicionarEstoqueDto,
  ): Promise<EstoqueDto> {
    return this.adicionarEstoqueUseCase.executar(produtoId, dto);
  }

  @Post('produto/:produtoId/remover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover estoque (ADMIN)' })
  @ApiResponse({ status: 200, type: EstoqueDto })
  remover(
    @Param('produtoId', ParseUUIDPipe) produtoId: string,
    @Body() dto: RemoverEstoqueDto,
  ): Promise<EstoqueDto> {
    return this.removerEstoqueUseCase.executar(produtoId, dto);
  }

  @Put('produto/:produtoId/ajustar')
  @ApiOperation({ summary: 'Ajustar estoque (ADMIN)' })
  @ApiResponse({ status: 200, type: EstoqueDto })
  ajustar(
    @Param('produtoId', ParseUUIDPipe) produtoId: string,
    @Body() dto: AjustarEstoqueDto,
  ): Promise<EstoqueDto> {
    return this.ajustarEstoqueUseCase.executar(produtoId, dto);
  }
}
