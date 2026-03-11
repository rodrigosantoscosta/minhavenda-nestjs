import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estoque } from '@domain/entities/estoque.entity';
import { IESTOQUE_REPOSITORY } from '@domain/repositories/iestoque.repository';
import { EstoqueTypeOrmRepository } from '@infra/persistence/repositories/estoque.typeorm.repository';
import { ConsultarEstoqueQuery } from '@app/use-cases/estoque/queries/consultar-estoque.query';
import { AdicionarEstoqueUseCase } from '@app/use-cases/estoque/commands/adicionar-estoque.use-case';
import { RemoverEstoqueUseCase } from '@app/use-cases/estoque/commands/remover-estoque.use-case';
import { AjustarEstoqueUseCase } from '@app/use-cases/estoque/commands/ajustar-estoque.use-case';
import { EstoqueController } from '@presentation/controllers/estoque.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Estoque])],
  controllers: [EstoqueController],
  providers: [
    { provide: IESTOQUE_REPOSITORY, useClass: EstoqueTypeOrmRepository },

    // Query
    ConsultarEstoqueQuery,

    // Commands
    AdicionarEstoqueUseCase,
    RemoverEstoqueUseCase,
    AjustarEstoqueUseCase,
  ],
  // Export so ProdutoModule / CarrinhoModule / CheckoutUseCase can inject IESTOQUE_REPOSITORY
  exports: [IESTOQUE_REPOSITORY],
})
export class EstoqueModule {}
