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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { CurrentUser } from '@infra/security/roles.decorator';
import { AuthenticatedUser } from '@infra/security/jwt.strategy';
import { ObterOuCriarCarrinhoQuery } from '@app/use-cases/carrinho/queries/obter-ou-criar-carrinho.query';
import { AdicionarItemCarrinhoUseCase } from '@app/use-cases/carrinho/commands/adicionar-item-carrinho.use-case';
import { AtualizarQuantidadeItemUseCase } from '@app/use-cases/carrinho/commands/atualizar-quantidade-item.use-case';
import { RemoverItemCarrinhoUseCase } from '@app/use-cases/carrinho/commands/remover-item-carrinho.use-case';
import { LimparCarrinhoUseCase } from '@app/use-cases/carrinho/commands/limpar-carrinho.use-case';
import { AdicionarItemCarrinhoDto } from '@app/dtos/carrinho/adicionar-item-carrinho.dto';
import { AtualizarItemCarrinhoDto } from '@app/dtos/carrinho/atualizar-item-carrinho.dto';
import { CarrinhoDto } from '@app/dtos/carrinho/carrinho.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Carrinho')
@ApiBearerAuth('JWT')
@Controller('carrinho')
@UseGuards(JwtAuthGuard)
export class CarrinhoController {
  constructor(
    private readonly obterOuCriarCarrinhoQuery: ObterOuCriarCarrinhoQuery,
    private readonly adicionarItemUseCase: AdicionarItemCarrinhoUseCase,
    private readonly atualizarQuantidadeItemUseCase: AtualizarQuantidadeItemUseCase,
    private readonly removerItemUseCase: RemoverItemCarrinhoUseCase,
    private readonly limparCarrinhoUseCase: LimparCarrinhoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter ou criar carrinho ativo' })
  @ApiResponse({ status: 200, type: CarrinhoDto })
  obter(@CurrentUser() user: AuthenticatedUser): Promise<CarrinhoDto> {
    return this.obterOuCriarCarrinhoQuery.executar(user.id);
  }

  @Post('itens')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar item ao carrinho' })
  @ApiResponse({ status: 201, type: CarrinhoDto })
  adicionarItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdicionarItemCarrinhoDto,
  ): Promise<CarrinhoDto> {
    return this.adicionarItemUseCase.executar(user.id, dto);
  }

  @Put('itens/:itemId')
  @ApiOperation({ summary: 'Atualizar quantidade de item do carrinho' })
  @ApiResponse({ status: 200, type: CarrinhoDto })
  atualizarItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: AtualizarItemCarrinhoDto,
  ): Promise<CarrinhoDto> {
    return this.atualizarQuantidadeItemUseCase.executar(user.id, itemId, dto);
  }

  @Delete('itens/:itemId')
  @ApiOperation({ summary: 'Remover item do carrinho' })
  @ApiResponse({ status: 200, type: CarrinhoDto })
  removerItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CarrinhoDto> {
    return this.removerItemUseCase.executar(user.id, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpar todos os itens do carrinho' })
  @ApiResponse({ status: 200, type: CarrinhoDto })
  limpar(@CurrentUser() user: AuthenticatedUser): Promise<CarrinhoDto> {
    return this.limparCarrinhoUseCase.executar(user.id);
  }
}
