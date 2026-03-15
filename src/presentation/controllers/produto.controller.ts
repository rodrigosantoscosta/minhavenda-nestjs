import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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
import { ListarProdutosQuery } from '@app/use-cases/produto/queries/listar-produtos.query';
import { BuscarProdutoPorIdQuery } from '@app/use-cases/produto/queries/buscar-produto-por-id.query';
import { CriarProdutoUseCase } from '@app/use-cases/produto/commands/criar-produto.use-case';
import { AtualizarProdutoUseCase } from '@app/use-cases/produto/commands/atualizar-produto.use-case';
import { ExcluirProdutoUseCase } from '@app/use-cases/produto/commands/excluir-produto.use-case';
import { CriarProdutoDto } from '@app/dtos/produto/criar-produto.dto';
import { AtualizarProdutoDto } from '@app/dtos/produto/atualizar-produto.dto';
import { FiltroProdutoDto } from '@app/dtos/produto/filtro-produto.dto';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { PageDto } from '@app/dtos/common/page.dto';

@ApiTags('Produtos')
@Controller('produtos')
export class ProdutoController {
  constructor(
    private readonly listarProdutosQuery: ListarProdutosQuery,
    private readonly buscarProdutoPorIdQuery: BuscarProdutoPorIdQuery,
    private readonly criarProdutoUseCase: CriarProdutoUseCase,
    private readonly atualizarProdutoUseCase: AtualizarProdutoUseCase,
    private readonly excluirProdutoUseCase: ExcluirProdutoUseCase,
  ) {}

  /**
   * GET /api/produtos
   * Public. Optional query params: termo, nome, categoriaId, precoMin, precoMax, ativo.
   * When `page` + `size` are provided returns a PageDto envelope; otherwise returns a flat array.
   */
  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros opcionais (público)' })
  @ApiResponse({ status: 200, description: 'Lista ou página de produtos' })
  listar(
    @Query() filtros: FiltroProdutoDto,
  ): Promise<ProdutoDto[] | PageDto<ProdutoDto>> {
    if (filtros.page !== undefined && filtros.size !== undefined) {
      return this.listarProdutosQuery.executar({
        ...filtros,
        page: filtros.page,
        size: filtros.size,
      });
    }
    return this.listarProdutosQuery.executar(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID (público)' })
  @ApiResponse({ status: 200, type: ProdutoDto })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  buscar(@Param('id', ParseUUIDPipe) id: string): Promise<ProdutoDto> {
    return this.buscarProdutoPorIdQuery.executar(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Criar produto (ADMIN)' })
  @ApiResponse({ status: 201, type: ProdutoDto })
  criar(@Body() dto: CriarProdutoDto): Promise<ProdutoDto> {
    return this.criarProdutoUseCase.executar(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Atualizar produto (ADMIN)' })
  @ApiResponse({ status: 200, type: ProdutoDto })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarProdutoDto,
  ): Promise<ProdutoDto> {
    return this.atualizarProdutoUseCase.executar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Excluir produto (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Excluído com sucesso' })
  excluir(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.excluirProdutoUseCase.executar(id);
  }
}
