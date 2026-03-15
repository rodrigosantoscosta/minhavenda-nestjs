import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { PedidoModule } from './pedido.module';
import { ProdutoModule } from './produto.module';
import { EstoqueModule } from './estoque.module';
import { AdminController } from '@presentation/controllers/admin.controller';
import { ObterDashboardStatsQuery } from '@app/use-cases/admin/obter-dashboard-stats.query';
import { ListarUsuariosQuery } from '@app/use-cases/admin/listar-usuarios.query';
import { AtivarUsuarioUseCase } from '@app/use-cases/admin/ativar-usuario.use-case';
import { DesativarUsuarioUseCase } from '@app/use-cases/admin/desativar-usuario.use-case';

@Module({
  imports: [
    // Provides and exports IUSUARIO_REPOSITORY + JWT guards
    AuthModule,
    // Provides and exports IPEDIDO_REPOSITORY
    PedidoModule,
    // Provides and exports IPRODUTO_REPOSITORY
    ProdutoModule,
    // Provides and exports IESTOQUE_REPOSITORY
    EstoqueModule,
  ],
  controllers: [AdminController],
  providers: [
    ObterDashboardStatsQuery,
    ListarUsuariosQuery,
    AtivarUsuarioUseCase,
    DesativarUsuarioUseCase,
  ],
})
export class AdminModule {}
