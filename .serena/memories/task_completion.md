# Task Completion Checklist

When finishing any task in this project:

1. **Lint**: `pnpm lint` — fix ESLint errors
2. **Format**: `pnpm format` — run Prettier
3. **Test**: `pnpm test` — ensure no regressions
4. **Build check**: `pnpm build` — confirm TypeScript compiles

If adding a new endpoint: update ARCHITECTURE.md API Surface table.
If adding a new migration: follow naming convention V{N}__description.ts.

## Completed Steps
- Steps 1–9: Auth, Categoria, Produto, Estoque, Carrinho modules fully implemented and tested.
- Step 10: Pedido module (client endpoints) — see NEXT_STEPS.md for details.
  - `@nestjs/event-emitter` installed, `EventEmitterModule.forRoot({ global: true })` in AppModule.
  - `Pedido` + `ItemPedido` entities now have TypeORM decorators; `@AfterLoad` populates email/nome from usuario relation.
- Step 11: Admin Pedido module — AdminPedidoController + 7 use cases (EnviarPedido, EntregarPedido, CancelarPedidoAdmin, PagarPedidoAdmin, ListarTodos, ListarPorStatus, BuscarAdmin).
  - `src/application/dtos/pedido/enviar-pedido.dto.ts` added.
  - Node.js added to system PATH (was only available via fnm shell, not to Serena language server).
  - Step 12: Domain Event Listeners — MessagingModule with MailerModule, PedidoEmailService, 3 listeners (email, notification, rabbitMQ-bridge stub), NotificacaoTypeOrmRepository, Notificacao entity with TypeORM decorators.
  - `@nestjs-modules/mailer` + `nodemailer` + `@types/nodemailer` installed.
  - Step 13: RabbitMQ + SSE — RabbitMQModule with producer, consumer (nack→DLQ), SseRegistry (Subject-based, 5-min TTL). GET /pedidos/stream (@Sse) added to PedidoController. Bridge listener upgraded from stub.
  - `@golevelup/nestjs-rabbitmq`, `amqplib`, `@types/amqplib` installed.
  - Step 14: Admin DLQ — DlqRequeueService (channel.get loop, republish, nack-back on error) + DlqAdminController (3 routes, ADMIN). Wired into RabbitMQModule.
  - Total tests: 187 passing across 25 test suites.
  - Step 15: Hardening + Swagger — GlobalExceptionFilter (was already complete), @nestjs/swagger + swagger-ui-express installed, all 8 controllers have @ApiTags/@ApiOperation/@ApiResponse, all 26 DTOs have @ApiProperty. AdminPedidoController got @ApiOperation/@ApiResponse added (was the only controller missing them). pnpm build: zero TS errors. 187 tests still passing.