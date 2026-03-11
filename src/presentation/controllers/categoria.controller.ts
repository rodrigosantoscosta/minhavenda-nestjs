import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { ListarCategoriasQuery } from '@app/use-cases/categoria/queries/listar-categorias.query';
import { BuscarCategoriaPorIdQuery } from '@app/use-cases/categoria/queries/buscar-categoria-por-id.query';
import { CriarCategoriaUseCase } from '@app/use-cases/categoria/commands/criar-categoria.use-case';
import { AtualizarCategoriaUseCase } from '@app/use-cases/categoria/commands/atualizar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '@app/use-cases/categoria/commands/excluir-categoria.use-case';
import { CriarCategoriaDto } from '@app/dtos/categoria/criar-categoria.dto';
import { AtualizarCategoriaDto } from '@app/dtos/categoria/atualizar-categoria.dto';
import { CategoriaDto } from '@app/dtos/categoria/categoria.dto';

@ApiTags('Categorias')
@Controller('categorias')
export class CategoriaController {
  constructor(
    private readonly listarCategoriasQuery: ListarCategoriasQuery,
    private readonly buscarCategoriaPorIdQuery: BuscarCategoriaPorIdQuery,
    private readonly criarCategoriaUseCase: CriarCategoriaUseCase,
    private readonly atualizarCategoriaUseCase: AtualizarCategoriaUseCase,
    private readonly excluirCategoriaUseCase: ExcluirCategoriaUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias (público)' })
  @ApiResponse({ status: 200, type: [CategoriaDto] })
  listar(): Promise<CategoriaDto[]> {
    return this.listarCategoriasQuery.executar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID (público)' })
  @ApiResponse({ status: 200, type: CategoriaDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  buscar(@Param('id', ParseIntPipe) id: number): Promise<CategoriaDto> {
    return this.buscarCategoriaPorIdQuery.executar(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Criar categoria (ADMIN)' })
  @ApiResponse({ status: 201, type: CategoriaDto })
  criar(@Body() dto: CriarCategoriaDto): Promise<CategoriaDto> {
    return this.criarCategoriaUseCase.executar(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Atualizar categoria (ADMIN)' })
  @ApiResponse({ status: 200, type: CategoriaDto })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarCategoriaDto,
  ): Promise<CategoriaDto> {
    return this.atualizarCategoriaUseCase.executar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Excluir categoria (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Excluída com sucesso' })
  async excluir(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.excluirCategoriaUseCase.executar(id);
  }
}
