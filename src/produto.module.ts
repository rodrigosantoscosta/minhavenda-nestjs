import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '@domain/entities/produto.entity';
import { IPRODUTO_REPOSITORY } from '@domain/repositories/iproduto.repository';
import { ProdutoTypeOrmRepository } from '@infra/persistence/repositories/produto.typeorm.repository';
import { CategoriaModule } from './categoria.module';
import { EstoqueModule } from './estoque.module';
import { ListarProdutosQuery } from '@app/use-cases/produto/queries/listar-produtos.query';
import { BuscarProdutoPorIdQuery } from '@app/use-cases/produto/queries/buscar-produto-por-id.query';
import { CriarProdutoUseCase } from '@app/use-cases/produto/commands/criar-produto.use-case';
import { AtualizarProdutoUseCase } from '@app/use-cases/produto/commands/atualizar-produto.use-case';
import { ExcluirProdutoUseCase } from '@app/use-cases/produto/commands/excluir-produto.use-case';
import { ProdutoController } from '@presentation/controllers/produto.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto]),
    // Provides ICATEGORIA_REPOSITORY needed by CriarProdutoUseCase and AtualizarProdutoUseCase
    CategoriaModule,
    // Provides IESTOQUE_REPOSITORY needed by CriarProdutoUseCase (auto-creates zero-stock record)
    EstoqueModule,
  ],
  controllers: [ProdutoController],
  providers: [
    { provide: IPRODUTO_REPOSITORY, useClass: ProdutoTypeOrmRepository },

    // Queries
    ListarProdutosQuery,
    BuscarProdutoPorIdQuery,

    // Commands
    CriarProdutoUseCase,
    AtualizarProdutoUseCase,
    ExcluirProdutoUseCase,
  ],
  exports: [IPRODUTO_REPOSITORY],
})
export class ProdutoModule {}
