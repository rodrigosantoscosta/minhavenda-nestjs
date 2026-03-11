import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '@domain/entities/categoria.entity';
import { ICATEGORIA_REPOSITORY } from '@domain/repositories/icategoria.repository';
import { CategoriaTypeOrmRepository } from '@infra/persistence/repositories/categoria.typeorm.repository';
import { ListarCategoriasQuery } from '@app/use-cases/categoria/queries/listar-categorias.query';
import { BuscarCategoriaPorIdQuery } from '@app/use-cases/categoria/queries/buscar-categoria-por-id.query';
import { CriarCategoriaUseCase } from '@app/use-cases/categoria/commands/criar-categoria.use-case';
import { AtualizarCategoriaUseCase } from '@app/use-cases/categoria/commands/atualizar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '@app/use-cases/categoria/commands/excluir-categoria.use-case';
import { CategoriaController } from '@presentation/controllers/categoria.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria])],
  controllers: [CategoriaController],
  providers: [
    { provide: ICATEGORIA_REPOSITORY, useClass: CategoriaTypeOrmRepository },

    // Queries
    ListarCategoriasQuery,
    BuscarCategoriaPorIdQuery,

    // Commands
    CriarCategoriaUseCase,
    AtualizarCategoriaUseCase,
    ExcluirCategoriaUseCase,
  ],
  // Export repository so other modules (e.g. ProdutoModule) can inject it if needed
  exports: [ICATEGORIA_REPOSITORY],
})
export class CategoriaModule {}
