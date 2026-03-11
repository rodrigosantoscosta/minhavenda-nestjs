import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import { ICARRINHO_REPOSITORY } from '@domain/repositories/icarrinho.repository';
import { CarrinhoTypeOrmRepository } from '@infra/persistence/repositories/carrinho.typeorm.repository';
import { ProdutoModule } from './produto.module';
import { EstoqueModule } from './estoque.module';
import { ObterOuCriarCarrinhoQuery } from '@app/use-cases/carrinho/queries/obter-ou-criar-carrinho.query';
import { AdicionarItemCarrinhoUseCase } from '@app/use-cases/carrinho/commands/adicionar-item-carrinho.use-case';
import { AtualizarQuantidadeItemUseCase } from '@app/use-cases/carrinho/commands/atualizar-quantidade-item.use-case';
import { RemoverItemCarrinhoUseCase } from '@app/use-cases/carrinho/commands/remover-item-carrinho.use-case';
import { LimparCarrinhoUseCase } from '@app/use-cases/carrinho/commands/limpar-carrinho.use-case';
import { CarrinhoController } from '@presentation/controllers/carrinho.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carrinho, ItemCarrinho]),
    // AdicionarItemCarrinhoUseCase needs IPRODUTO_REPOSITORY
    ProdutoModule,
    // AdicionarItemCarrinhoUseCase and AtualizarQuantidadeItemUseCase need IESTOQUE_REPOSITORY
    EstoqueModule,
  ],
  controllers: [CarrinhoController],
  providers: [
    { provide: ICARRINHO_REPOSITORY, useClass: CarrinhoTypeOrmRepository },

    // Query
    ObterOuCriarCarrinhoQuery,

    // Commands
    AdicionarItemCarrinhoUseCase,
    AtualizarQuantidadeItemUseCase,
    RemoverItemCarrinhoUseCase,
    LimparCarrinhoUseCase,
  ],
  // Export so CheckoutUseCase (PedidoModule) can inject ICARRINHO_REPOSITORY
  exports: [ICARRINHO_REPOSITORY],
})
export class CarrinhoModule {}
