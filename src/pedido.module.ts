import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '@domain/entities/pedido.entity';
import { ItemPedido } from '@domain/entities/item-pedido.entity';
import { IPEDIDO_REPOSITORY } from '@domain/repositories/ipedido.repository';
import { PedidoTypeOrmRepository } from '@infra/persistence/repositories/pedido.typeorm.repository';
import { CarrinhoModule } from './carrinho.module';
import { EstoqueModule } from './estoque.module';
import { RabbitMQModule } from './rabbitmq.module';
import { FinalizarCheckoutUseCase } from '@app/use-cases/pedido/commands/finalizar-checkout.use-case';
import { PagarPedidoUseCase } from '@app/use-cases/pedido/commands/pagar-pedido.use-case';
import { CancelarPedidoUseCase } from '@app/use-cases/pedido/commands/cancelar-pedido.use-case';
import { ListarMeusPedidosQuery } from '@app/use-cases/pedido/queries/listar-meus-pedidos.query';
import { BuscarPedidoQuery } from '@app/use-cases/pedido/queries/buscar-pedido.query';
import { PedidoController } from '@presentation/controllers/pedido.controller';
import { AdminPedidoController } from '@presentation/controllers/admin-pedido.controller';
import { PagarPedidoAdminUseCase } from '@app/use-cases/pedido/commands/pagar-pedido-admin.use-case';
import { EnviarPedidoUseCase } from '@app/use-cases/pedido/commands/enviar-pedido.use-case';
import { EntregarPedidoUseCase } from '@app/use-cases/pedido/commands/entregar-pedido.use-case';
import { CancelarPedidoAdminUseCase } from '@app/use-cases/pedido/commands/cancelar-pedido-admin.use-case';
import { ListarTodosPedidosQuery } from '@app/use-cases/pedido/queries/listar-todos-pedidos.query';
import { ListarPedidosPorStatusQuery } from '@app/use-cases/pedido/queries/listar-pedidos-por-status.query';
import { BuscarPedidoAdminQuery } from '@app/use-cases/pedido/queries/buscar-pedido-admin.query';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, ItemPedido]),
    // FinalizarCheckoutUseCase needs ICARRINHO_REPOSITORY
    CarrinhoModule,
    // FinalizarCheckoutUseCase needs IESTOQUE_REPOSITORY
    EstoqueModule,
    // PedidoController needs SseRegistry for GET /pedidos/stream
    RabbitMQModule,
  ],
  controllers: [PedidoController, AdminPedidoController],
  providers: [
    { provide: IPEDIDO_REPOSITORY, useClass: PedidoTypeOrmRepository },

    // Client commands
    FinalizarCheckoutUseCase,
    PagarPedidoUseCase,
    CancelarPedidoUseCase,

    // Admin commands
    PagarPedidoAdminUseCase,
    EnviarPedidoUseCase,
    EntregarPedidoUseCase,
    CancelarPedidoAdminUseCase,

    // Client queries
    ListarMeusPedidosQuery,
    BuscarPedidoQuery,

    // Admin queries
    ListarTodosPedidosQuery,
    ListarPedidosPorStatusQuery,
    BuscarPedidoAdminQuery,
  ],
  exports: [IPEDIDO_REPOSITORY],
})
export class PedidoModule {}
