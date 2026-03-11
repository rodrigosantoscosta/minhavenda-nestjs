# NEXT_STEPS.md — MinhaVenda NestJS Build Tracker

> Mark steps `[x]` as you complete them. Add notes for anything surprising.
> Do not delete steps — the history matters.

---

## Code Review Pass (Steps 1–4) — completed

A full review of steps 1–4 was performed and the following corrections were applied:

- **tsconfig.json** — `module` was `"nodenext"` (breaks NestJS decorators, reflect-metadata, ts-jest). Changed to `"commonjs"`. Removed `resolvePackageJsonExports` and `moduleResolution: "nodenext"`.
- **main.ts** — `app.enableCors()` with no arguments defaults to wildcard `*`. Fixed to read `CORS_ALLOWED_ORIGINS` from env and apply an explicit method + header whitelist. Added global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`). Added conditional Swagger scaffold (commented-out, gated by `SWAGGER_ENABLED=true`).
- **package.json** — `helmet`, `class-validator`, `class-transformer` were missing from `dependencies` despite being used at runtime. Added. Removed `@types/decimal.js` (type-only, belongs in devDependencies).
- **AppController / AppService** — Hello World placeholder replaced with `GET /api/health` returning `{ status, timestamp }`. Spec updated.
- **app.module.ts** — migrations path now environment-aware: `src/migrations/*.ts` in dev/test, `dist/migrations/*.js` in prod.
- **IProdutoRepository** — Added `FiltrosProduto` interface and `findAll(filtros?: FiltrosProduto)`.
- **IPedidoRepository** — Added `findAll()` and `findByStatus(status)` for admin queries.
- **IEstoqueRepository** — Added `findByProdutoIdOrThrow(produtoId)`.
- **Pedido entity** — Added `static criarDoCarrinho(params)` factory, renamed `events` → `_events`, added `CriarPedidoParams` interface, emits `PedidoCriadoEvent`.

---

## Step 5 Pass (Auth review) — completed

All auth files were already scaffolded correctly. Fixes during this pass:

- **package.json jest config** — added `moduleNameMapper` for path aliases (`@domain/*`, `@app/*`, `@infra/*`, `@presentation/*`). Without this, any spec using those aliases throws "Cannot find module" under jest.
- **`@types/pg`** added to devDependencies (was in checklist but missing from file).
- **Unit tests written**: `register.use-case.spec.ts`, `login.use-case.spec.ts`, `alterar-senha.use-case.spec.ts`.

---

## Step 6 Pass (Categoria review) — completed

All Categoria files were already scaffolded. Unit tests added during this pass.
Note: duplicate-name check in Criar/Atualizar loads all categories in memory (no `findByNome`). Fine for MVP.

---

## Step 7 Pass (Produto review) — completed

All Produto files were already scaffolded, including `criar` and `atualizar` spec files.
3 missing spec files written: `excluir` (3), `listar` (5), `buscar` (4) = 12 new tests.
Notable: `ProdutoTypeOrmRepository.findAll` uses `QueryBuilder` with ILIKE, price range, categoria FK join, and defaults `ativo=true`.
`ProdutoModule` imports `CategoriaModule` to provide `ICATEGORIA_REPOSITORY` to the two use cases that need it.

---

## Step 8 Pass (Estoque review) — completed

All Estoque files were already scaffolded, including domain entity tests and use-case spec files.
Both spec files enhanced with missing test cases (BIGSERIAL id coercion, produtoId routing, DTO field completeness, save-not-called-on-throw).
Total after enhancement: commands spec 17 tests, query spec 4 tests, entity spec 14 tests = 35 tests for Step 8.
Notable: all 4 routes are ADMIN-only (`@UseGuards` + `@Roles` applied at class level on the controller).
`EstoqueModule` exports `IESTOQUE_REPOSITORY` for use by future `CarrinhoModule` and `CheckoutUseCase`.

---

## Step 9 Pass (Carrinho review) — completed

All Carrinho files were already scaffolded. 4 missing command spec files written.
Cross-checked all use-case logic against the Java `CarrinhoService` source — no behavioural misalignments found.
One deliberate improvement over Java: `AdicionarItemCarrinhoUseCase` checks stock inclusive of quantity already in cart (`quantidadeJaNoCarrinho + dto.quantidade`), whereas Java checks the new quantity alone and then rechecks on merge. Our approach is more correct.
Item ownership in `AtualizarQuantidadeItemUseCase` and `RemoverItemCarrinhoUseCase` is implicitly guaranteed by loading items from the user's own active cart (more secure than Java's explicit cross-check).

---

## Step 1 — Bootstrap

- [x] `pnpm init` + install NestJS CLI globally
- [x] `nest new . --package-manager pnpm --skip-git` (inside `E:\code\minhavenda-nestjs`)
- [x] Configure `tsconfig.json` — strict mode, paths aliases (`@domain/*`, `@app/*`, `@infra/*`), **module: "commonjs"**
- [x] Configure `eslint` + `prettier` matching Java project style (2-space indent, single quotes)
- [x] Create folder structure as defined in `AGENTS.md § Project Structure` (can be empty files/gitkeeps)
- [x] `main.ts` — port 3000, global prefix `/api`, explicit CORS from env, `helmet()`, global `ValidationPipe`
- [x] `AppModule` — ConfigModule + TypeOrmModule wired; feature module placeholders to be added per step
- [x] `GET /api/health` — returns `{ status: 'ok', timestamp }` (replaces Hello World placeholder)
- [ ] Verify: `pnpm run start:dev` boots without error (pending local DB)

---

## Step 2 — Config Module (Fail-Fast)

- [x] `pnpm add @nestjs/config joi`
- [x] Create `src/infrastructure/config/env.validation.ts` — Joi schema for ALL env vars, `abortEarly: false`
- [x] Create `src/infrastructure/config/database.config.ts`
- [x] Create `src/infrastructure/config/jwt.config.ts`
- [x] Create `src/infrastructure/config/rabbitmq.config.ts`
- [x] Create `src/infrastructure/config/mail.config.ts`
- [x] Register `ConfigModule.forRoot({ validate, isGlobal: true })` in `AppModule`
- [x] Create `.env.example` (all keys, no values)
- [x] Create `.env` from `.env.example`, fill values for local dev
- [ ] Verify: app refuses to start if `JWT_SECRET` is missing from `.env` (pending manual test)

---

## Step 3 — Domain Layer

> No external dependencies. Pure TypeScript.

- [x] **Enums**
  - [x] `src/domain/enums/status-pedido.enum.ts` — CRIADO, PAGO, ENVIADO, ENTREGUE, CANCELADO
  - [x] `src/domain/enums/status-carrinho.enum.ts` — ATIVO, FINALIZADO, ABANDONADO
  - [x] `src/domain/enums/tipo-usuario.enum.ts` — ADMIN, CLIENTE

- [x] **Exceptions**
  - [x] `src/domain/exceptions/business.exception.ts` extends `Error`
  - [x] `src/domain/exceptions/resource-not-found.exception.ts` extends `Error`
  - [x] `src/domain/exceptions/entity-already-exists.exception.ts` extends `Error`

- [x] **Value Objects**
  - [x] `src/domain/value-objects/money.value-object.ts` — `valor: Decimal` (Decimal.js), `moeda: 'BRL'`, `of()`, `zero()`, `somar()`, `subtrair()`, `multiplicar()`, `maiorQue()`
  - [x] `src/domain/value-objects/email.value-object.ts` — regex validation, `.valor` accessor

- [x] **Events**
  - [x] `src/domain/events/base-domain.event.ts` — `eventId: string`, `occurredOn: Date`, `eventType: string`
  - [x] `src/domain/events/pedido-criado.event.ts`
  - [x] `src/domain/events/pedido-pago.event.ts`
  - [x] `src/domain/events/pedido-enviado.event.ts`
  - [x] `src/domain/events/pedido-cancelado.event.ts`

- [x] **Repository Interfaces** (Symbol tokens + interfaces only — no implementation)
  - [x] `IUsuarioRepository`
  - [x] `IProdutoRepository` — `findAll(filtros?: FiltrosProduto)` with `FiltrosProduto` type
  - [x] `ICategoriaRepository`
  - [x] `IEstoqueRepository` — includes `findByProdutoIdOrThrow(produtoId)`
  - [x] `ICarrinhoRepository`
  - [x] `IPedidoRepository` — includes `findAll()` and `findByStatus(status)`
  - [x] `INotificacaoRepository`

- [x] **Entities** (TypeORM decorators + domain model)
  - [x] `Usuario` — id UUID, nome, email (Email VO), senha (bcrypt hash), tipo TipoUsuario, ativo, dataCadastro
  - [x] `Categoria` — id BIGINT, nome (unique), descricao, ativo, dataCadastro
  - [x] `Produto` — id UUID, nome, descricao, preco (Money VO embedded), urlImagem, peso, dimensoes, categoria FK, ativo, dataCadastro
  - [x] `Estoque` — id BIGINT, produto OneToOne, quantidade (>= 0), atualizadoEm; methods: `adicionar()`, `remover()`, `reservar()`, `ajustar()`, `temEstoqueSuficiente()`
  - [x] `Carrinho` — id UUID, usuario, status, itens[], valorTotal, quantidadeTotal, timestamps; methods: `adicionarItem()`, `removerItem()`, `calcularValorTotal()`, `finalizar()`
  - [x] `ItemCarrinho` — id UUID, carrinho FK, produto FK, quantidade, precoUnitario, subtotal; methods: `atualizarQuantidade()`, `recalcularSubtotal()`
  - [x] `Pedido` (Aggregate Root) — id UUID, usuario, status, financials, enderecoEntrega, rastreio, timestamps, `_events: BaseDomainEvent[]` (transient); methods: `static criarDoCarrinho()`, `marcarComoPago()`, `marcarComoEnviado()`, `marcarComoEntregue()`, `cancelar()`, `consumeEvents()`
  - [x] `ItemPedido` — id UUID, pedido FK, produto FK, produtoNome (price/name snapshot), quantidade, precoUnitario, subtotal
  - [x] `Notificacao` — id BIGINT, usuario FK, tipo (EMAIL | SMS), mensagem, enviado bool, enviadoEm

---

## Step 4 — TypeORM + Migrations

- [x] `pnpm add @nestjs/typeorm typeorm pg`
- [x] `pnpm add -D @types/pg`
- [x] Register `TypeOrmModule.forRootAsync(...)` in `AppModule`, reads config from `ConfigService`
- [x] Set `synchronize: false`, `migrationsRun: true`, `logging: false`
- [x] Migration path is environment-aware: `src/migrations/*.ts` in dev/test, `dist/migrations/*.js` in prod
- [x] Port **V1** migration — recreate from `E:\code\code2\minhavenda\src\main\resources\db\migration\V1__create_tables.sql`
- [x] Port **V2** migration (indexes)
- [x] Port **V3** migration (seed categorias)
- [x] Port **V4** migration (seed usuarios — bcrypt hashed passwords)
- [x] Port **V5** migration (seed produtos)
- [x] Port **V6, V7, V9** migrations (url_imagem updates)
- [x] Port **V10** migration (add column pedido)
- [ ] Verify: `pnpm run typeorm migration:run` applies all migrations cleanly on fresh DB

---

## Step 5 — Auth Module

- [x] `pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt`
- [x] `pnpm add -D @types/passport-jwt @types/bcrypt`
- [x] `src/infrastructure/security/jwt.strategy.ts` — validate payload, embed `{ id, email, role }` (no DB hit for role)
- [x] `src/infrastructure/security/jwt-auth.guard.ts`
- [x] `src/infrastructure/security/roles.guard.ts` + `@Roles()` + `@CurrentUser()` decorators
- [x] TypeORM implementation of `IUsuarioRepository`
- [x] `src/application/use-cases/auth/register.use-case.ts` — hash password with bcrypt (12 rounds), throw `EntityAlreadyExistsException` if email exists
- [x] `src/application/use-cases/auth/login.use-case.ts` — compare hash, sign JWT with `{ sub, email, role, jti }`; generic error message (does not reveal email existence)
- [x] `src/application/use-cases/auth/alterar-senha.use-case.ts` — verify current password, reject same-as-old, re-hash and save
- [x] `src/application/dtos/auth/register-request.dto.ts` — `@MinLength(8)`, `@MaxLength(72)`, `@IsEmail()`
- [x] `src/application/dtos/auth/login-request.dto.ts`
- [x] `src/application/dtos/auth/auth-response.dto.ts` — `{ token, email, nome }`
- [x] `src/application/dtos/auth/alterar-senha-request.dto.ts`
- [x] `src/presentation/controllers/auth.controller.ts` — POST `/auth/register`, POST `/auth/login`, POST `/auth/alterar-senha`
- [x] `AuthModule` wiring — exports `JwtModule`, `PassportModule`, `JwtStrategy`
- [x] `ThrottlerModule` registered in `AppModule`; `@Throttle({ default: { limit: 10, ttl: 60_000 } })` on register and login
- [x] Unit tests: `register.use-case.spec.ts`, `login.use-case.spec.ts`, `alterar-senha.use-case.spec.ts`
- [x] `package.json` jest `moduleNameMapper` added for path aliases
- [ ] Verify: `pnpm install && pnpm test` — all unit tests pass
- [ ] Verify: register → login → use token on protected endpoint (requires running DB)

---

## Step 6 — Categoria Module

- [x] TypeORM implementation of `ICategoriaRepository`
- [x] Use cases: `CriarCategoriaUseCase`, `ListarCategoriasUseCase`, `BuscarCategoriaPorIdUseCase`, `AtualizarCategoriaUseCase`, `ExcluirCategoriaUseCase`
- [x] DTOs: `CategoriaDto`, `CriarCategoriaDto`, `AtualizarCategoriaDto`
- [x] Mapper: `CategoriaMapper` (static) — coerces BIGSERIAL id to `Number`
- [x] Controller: `CategoriaController` — GET `/categorias`, GET `/categorias/:id`, POST `/categorias` (ADMIN), PUT `/categorias/:id` (ADMIN), DELETE `/categorias/:id` (ADMIN)
- [x] `CategoriaModule` wiring
- [x] Unit tests: `criar` (5), `atualizar` (6), `excluir` (3), `listar` (3), `buscar` (3) = 20 tests
- [ ] Verify: `pnpm test` — all tests pass
- [ ] Verify: end-to-end via Swagger or curl against running DB

---

## Step 7 — Produto Module

- [x] TypeORM implementation of `IProdutoRepository` — `findAll(filtros?)` uses `QueryBuilder` (ILIKE for nome, price range, categoria FK join, `ativo` defaults to `true`)
- [x] Use cases: `CriarProdutoUseCase`, `ListarProdutosUseCase`, `BuscarProdutoPorIdUseCase`, `AtualizarProdutoUseCase`, `ExcluirProdutoUseCase`
- [x] DTOs: `ProdutoDto`, `CriarProdutoDto`, `AtualizarProdutoDto`, `FiltroProdutoDto` (query-param boolean transform included)
- [x] Mapper: `ProdutoMapper` (static) — `preco.valor.toNumber()`, `pesoKg` coerced to `Number`, categoria id coerced to `Number`
- [x] Controller: `ProdutoController` — GET `/produtos` (public, filtered), GET `/produtos/:id` (public), POST `/produtos` (ADMIN), PUT `/produtos/:id` (ADMIN), DELETE `/produtos/:id` (ADMIN)
- [x] `ProdutoModule` wiring — imports `CategoriaModule` to inject `ICATEGORIA_REPOSITORY`
- [x] Unit tests: `criar` (7), `atualizar` (7), `excluir` (3), `listar` (5), `buscar` (4) = 26 tests
- [ ] Verify: `pnpm test` — all tests pass
- [ ] Verify: end-to-end via Swagger or curl against running DB

---

## Step 8 — Estoque Module

- [x] TypeORM implementation of `IEstoqueRepository` — `findByProdutoIdOrThrow()`, `save()` reloads with relations
- [x] Use cases: `AdicionarEstoqueUseCase`, `RemoverEstoqueUseCase`, `AjustarEstoqueUseCase`, `ConsultarEstoqueUseCase`
- [x] DTOs: `EstoqueDto`, `AdicionarEstoqueDto`, `RemoverEstoqueDto`, `AjustarEstoqueDto`
- [x] Mapper: `EstoqueMapper` (static) — coerces BIGSERIAL id to `Number`
- [x] Controller: `EstoqueController` — all 4 routes ADMIN-only (guards applied at class level)
  - GET `/estoque/produto/:produtoId`
  - POST `/estoque/produto/:produtoId/adicionar`
  - POST `/estoque/produto/:produtoId/remover`
  - PUT `/estoque/produto/:produtoId/ajustar`
- [x] `EstoqueModule` wiring — exports `IESTOQUE_REPOSITORY` for future Carrinho/Checkout use cases
- [x] Domain entity tests: `estoque.entity.spec.ts` (14 tests)
- [x] Command use-case tests: `estoque-commands.use-case.spec.ts` (17 tests, enhanced)
- [x] Query tests: `consultar-estoque.query.spec.ts` (4 tests, enhanced)
- [ ] Verify: `pnpm test` — all tests pass
- [ ] Verify: end-to-end via Swagger or curl against running DB

---

## Step 9 — Carrinho Module

- [x] TypeORM implementation of `ICarrinhoRepository` — `save()` reloads with full relations; `findAtivoByUsuarioId` filters by `StatusCarrinho.ATIVO`; `ItemCarrinho` loaded as part of `Carrinho` via cascade (no separate repo needed)
- [x] Use cases:
  - [x] `ObterOuCriarCarrinhoQuery` — returns existing ATIVO cart or creates+saves a new one
  - [x] `AdicionarItemCarrinhoUseCase` — creates cart if none exists; validates produto ativo; checks stock inclusive of quantity already in cart; merges via `Carrinho.adicionarItem()`
  - [x] `AtualizarQuantidadeItemUseCase` — ownership guaranteed by loading item from user's own active cart; validates stock; updates via `ItemCarrinho.atualizarQuantidade()`
  - [x] `RemoverItemCarrinhoUseCase` — validates item in cart; removes via `Carrinho.removerItem()`; cascade orphan-delete handles DB row
  - [x] `LimparCarrinhoUseCase` — clears `itens = []`; recalculates totals; cascade orphan-delete removes all rows
- [x] DTOs: `CarrinhoDto`, `ItemCarrinhoDto`, `AdicionarItemCarrinhoDto`, `AtualizarItemCarrinhoDto`
- [x] Mapper: `CarrinhoMapper` (static) — `valorTotal` and `precoUnitario`/`subtotal` coerced from PG DECIMAL string to `Number`
- [x] Controller: `CarrinhoController` — all routes `@UseGuards(JwtAuthGuard)` at class level, `@CurrentUser()` injects user id
  - GET `/carrinho`
  - POST `/carrinho/itens` — 201
  - PUT `/carrinho/itens/:itemId`
  - DELETE `/carrinho/itens/:itemId`
  - DELETE `/carrinho` — 200 (returns cleared cart)
- [x] `CarrinhoModule` wiring — imports `ProdutoModule` (for `IPRODUTO_REPOSITORY`) and `EstoqueModule` (for `IESTOQUE_REPOSITORY`); exports `ICARRINHO_REPOSITORY` for `CheckoutUseCase`
- [x] Unit tests: `obter-ou-criar` (4), `adicionar-item` (7), `atualizar-quantidade` (6), `remover-item` (5), `limpar` (5) = 27 tests
- [ ] Verify: `pnpm test` — all tests pass
- [ ] Verify: end-to-end via Swagger or curl against running DB

---

## Step 10 Pass (Pedido client review) — completed

`Pedido` and `ItemPedido` domain entities upgraded with TypeORM decorators (no separate persistence layer needed).
`@AfterLoad` hook populates `emailUsuario`/`nomeUsuario`/`telefoneUsuario` from the `usuario` relation.
`@nestjs/event-emitter` installed; `EventEmitterModule.forRoot({ global: true })` added to `AppModule`.
`FinalizarCheckoutUseCase` uses `DataSource.transaction()` for atomic stock reservation + cart finalisation + pedido insert.
`PagarPedidoUseCase` / `CancelarPedidoUseCase` use ownership-safe 404 (never 403) to avoid revealing order existence.
Also fixed 5 pre-existing test failures from Steps 7–9 (Email VO, missing estoqueRepo arg).
Total new tests: commands spec (17 tests), queries spec (9 tests) = 26 tests.

## Step 10 — Pedido Module (Client endpoints)

- [x] TypeORM implementation of `IPedidoRepository` — implement `findAll()`, `findByStatus()`, `findByIdOrThrow()`
- [x] Use cases:
  - [x] `FinalizarCheckoutUseCase` — validate cart not empty, validate stock for each item, create Pedido via `Pedido.criarDoCarrinho()` static factory, reserve stock, finalize cart — all in one `DataSource.transaction()`; publish `PedidoCriadoEvent` after commit
  - [x] `PagarPedidoUseCase` — validate pedido belongs to user, call `pedido.marcarComoPago()`, save, publish `PedidoPagoEvent`
  - [x] `CancelarPedidoUseCase` (client) — validate pedido belongs to user, call `pedido.cancelar()`, save, publish `PedidoCanceladoEvent`
  - [x] `ListarMeusPedidosQuery` — `findByUsuarioId()`, ordered by dataCriacao DESC
  - [x] `BuscarPedidoQuery` — find by id AND usuarioId (ownership check)
- [x] DTOs: `PedidoDto`, `PedidoDetalhadoDto`, `ItemPedidoDto`, `CheckoutRequestDto`, `PagarPedidoDto`, `CancelarPedidoDto`
- [x] Mapper: `PedidoMapper` (static) — DECIMAL coercion, `toDto` + `toDetalhadoDto`
- [x] Controller: `PedidoController` — all authenticated
  - POST `/checkout/finalizar`
  - GET `/meus-pedidos`
  - GET `/pedidos/:id`
  - POST `/pedidos/:id/pagar`
  - POST `/pedidos/:id/cancelar`
- [x] `PedidoModule` wiring — imports CarrinhoModule + EstoqueModule; exports `IPEDIDO_REPOSITORY`
- [ ] Verify: `pnpm test` — all tests pass ✓ (163 tests)
- [ ] Verify: end-to-end checkout flow via Swagger or curl against running DB

---

## Step 11 Pass (Admin Pedido review) — completed

All admin use cases, controller, and spec implemented in this pass.
No ownership checks on admin use cases (by design). `EntregarPedidoUseCase` has no event emitter — no `PedidoEntregueEvent` per architecture.
Total new tests: 24 across `admin-pedido.use-cases.spec.ts` (5 suites: Enviar×5, Entregar×4, CancelarAdmin×5, PagarAdmin×4, ListarTodos×2, ListarPorStatus×2, BuscarAdmin×2 = 24).
Total tests: 187 passing across 25 test suites.

## Step 11 — Admin Pedido Module

- [x] Use cases:
  - [x] `EnviarPedidoUseCase` — ADMIN, set codigoRastreio + transportadora, call `pedido.marcarComoEnviado()`, save, publish `PedidoEnviadoEvent`
  - [x] `EntregarPedidoUseCase` — ADMIN, call `pedido.marcarComoEntregue()`, save (no event emitted)
  - [x] `CancelarPedidoAdminUseCase` — ADMIN, call `pedido.cancelar(motivo)`, save, publish `PedidoCanceladoEvent`
  - [x] `PagarPedidoAdminUseCase` — ADMIN, pay without ownership check, publish `PedidoPagoEvent`
  - [x] `ListarTodosPedidosQuery` — uses `IPedidoRepository.findAll()`
  - [x] `ListarPedidosPorStatusQuery` — uses `IPedidoRepository.findByStatus(status)`
  - [x] `BuscarPedidoAdminQuery` — no ownership check
- [x] Controller: `AdminPedidoController` — all `@Roles(TipoUsuario.ADMIN)`
  - [x] GET `/admin/pedidos`
  - [x] GET `/admin/pedidos/status/:status`
  - [x] GET `/admin/pedidos/:id`
  - [x] POST `/admin/pedidos/:id/pagar`
  - [x] POST `/admin/pedidos/:id/enviar`
  - [x] POST `/admin/pedidos/:id/entregar`
  - [x] POST `/admin/pedidos/:id/cancelar`
- [x] Unit tests: 24 new tests across 7 describe blocks
- [x] Verify: `pnpm test` — 187 tests passing ✓

---

## Step 12 Pass (Domain Event Listeners) — completed

`@nestjs-modules/mailer` + `nodemailer` + `@types/nodemailer` installed.
`Notificacao` entity upgraded with TypeORM decorators (`@Entity('notificacoes')`, BIGSERIAL PK, ManyToOne usuario).
`NotificacaoTypeOrmRepository` created.
`PedidoEmailService` — plain-text emails matching Java source exactly, 4 methods.
3 independent `@OnEvent({ async: true })` listeners created.
`PedidoRabbitMQBridgeListener` is a stub (logs only) — producer injected in Step 13.
`MessagingModule` wires MailerModule (forRootAsync from env), TypeORM Notificacao, all 3 listeners + EmailService. Registered in AppModule.
Total tests: 187 still passing (listeners are integration-only, no new unit tests needed).

## Step 12 — Domain Event Listeners

- [x] `pnpm add @nestjs-modules/mailer nodemailer` + `pnpm add -D @types/nodemailer`
- [x] `EventEmitterModule.forRoot({ global: true })` already in AppModule from Step 10
- [x] `src/infrastructure/messaging/listeners/pedido-email.listener.ts` — `@OnEvent` × 4 events
- [x] `src/infrastructure/messaging/listeners/pedido-notification.listener.ts` — saves Notificacao DB record
- [x] `src/infrastructure/messaging/listeners/pedido-rabbitmq-bridge.listener.ts` — stub, producer in Step 13
- [x] `pnpm add @nestjs-modules/mailer nodemailer` ✓
- [x] Configure `MailerModule.forRootAsync(...)` in `MessagingModule` pointing to Mailhog env vars
- [x] `PedidoEmailService` — plain-text emails matching Java source content
- [x] `Notificacao` entity upgraded with TypeORM decorators
- [x] `NotificacaoTypeOrmRepository` created
- [x] `MessagingModule` registered in `AppModule`
- [x] Verify: `pnpm test` — 187 tests passing ✓


---

## Step 13 Pass (RabbitMQ + SSE) — completed

`@golevelup/nestjs-rabbitmq` + `amqplib` + `@types/amqplib` installed.
4 message DTOs created (PedidoCriado/Pago/Enviado/Cancelado).
`rabbitmq.constants.ts` — all exchange/queue/routing-key constants matching Java source.
`PedidoRabbitMQProducer` — publishes to `pedidos.exchange` via `AmqpConnection`.
`PedidoRabbitMQConsumer` — `@RabbitSubscribe` × 4 queues with DLQ arguments; nack-to-DLQ on error; calls `SseRegistry.sendEvent`.
`SseRegistry` — `Map<string, Subject<MessageEvent>>` with 5-min TTL cleanup, `OnModuleDestroy` drain.
`PedidoRabbitMQBridgeListener` upgraded from stub: uses `@Optional() PedidoRabbitMQProducer` so tests still boot without RabbitMQ.
`RabbitMQModule` — `GolevelupRabbitMQModule.forRootAsync`, declares DLQs and DLX exchange; `connectionInitOptions: { wait: false }` so app starts even if RabbitMQ is down.
`PedidoController` — `GET /pedidos/stream` (`@Sse`) added; `SseRegistry` injected.
`RabbitMQModule` imported in `AppModule` and `PedidoModule`.
Total tests: 187 still passing.

## Step 13 — RabbitMQ Producer + Consumer + SSE

- [x] `pnpm add @golevelup/nestjs-rabbitmq amqplib` + `pnpm add -D @types/amqplib`
- [x] Register `RabbitMQModule.forRootAsync(...)` in `RabbitMQModule`
- [x] Exchange + Queue declarations: `pedidos.exchange` (topic), `pedidos.dlx` (direct), 4 business queues with DLX args, 4 DLQs
- [x] Message DTOs: `PedidoCriadoMessage`, `PedidoPagoMessage`, `PedidoEnviadoMessage`, `PedidoCanceladoMessage`
- [x] `PedidoRabbitMQProducer` — publishes to exchange via `AmqpConnection`
- [x] `PedidoRabbitMQConsumer` — `@RabbitSubscribe` × 4, nack→DLQ on error, SSE fan-out
- [x] `SseRegistry` — `Map<string, Subject<MessageEvent>>`, 5-min TTL, `OnModuleDestroy`
- [x] `GET /pedidos/stream` (`@Sse`) in `PedidoController`
- [x] `PedidoRabbitMQBridgeListener` — stub replaced with real producer (`@Optional` injection)
- [x] Verify: `pnpm test` — 187 tests passing ✓

---

## Step 14 Pass (Admin DLQ) — completed

`DlqRequeueService` — drains DLQs via `amqpConnection.channel.get()` loop, republishes to `pedidos.exchange` with original routing key, nacks-back on error.
`DlqAdminController` — 3 routes (GET queues, POST requeue/:queue, POST requeue-all), all ADMIN-guarded. Validation errors returned as 200 with error key (mirrors Java behaviour).
Both wired into `RabbitMQModule`.
Total tests: 187 still passing.

## Step 14 — Admin DLQ

- [x] `DlqRequeueService` — `requeue(dlqName)` drains one DLQ via `channel.get()`, republishes to exchange
- [x] `DlqRequeueService.requeueAll()` — iterates all 4 DLQs in sequence
- [x] `DlqAdminController` — all `@Roles(TipoUsuario.ADMIN)`
  - [x] GET `/admin/dlq/queues`
  - [x] POST `/admin/dlq/requeue/:queue`
  - [x] POST `/admin/dlq/requeue-all`
- [x] Wired into `RabbitMQModule` (controller + provider)
- [x] Verify: `pnpm test` — 187 tests passing ✓

---

## Step 15 Pass (Hardening + Swagger) — completed

GlobalExceptionFilter was already fully implemented and registered as APP_FILTER.
All 8 controllers already had @ApiTags + @ApiOperation + @ApiResponse — only AdminPedidoController was missing @ApiOperation/@ApiResponse, which were added.
All 26 DTOs already had @ApiProperty throughout.
@nestjs/swagger + swagger-ui-express confirmed installed. main.ts dynamic-import scaffold was already in place (gated by SWAGGER_ENABLED=true, mounted at /api/docs).
pnpm build: zero TypeScript errors. 187 tests passing.

## Step 15 — Hardening + Swagger

- [x] **GlobalExceptionFilter**: maps `ResourceNotFoundException` → 404, `EntityAlreadyExistsException` → 409, `BusinessException` → 422, `ValidationError` → 400, unknown → 500
- [x] Register `GlobalExceptionFilter` as `APP_FILTER` in `AppModule`
- [x] **Swagger**: `pnpm add @nestjs/swagger swagger-ui-express`; dynamic import in `main.ts`; only active when `SWAGGER_ENABLED=true`; mounted at `/api/docs`
- [x] `@nestjs/swagger` decorators on all controllers and DTOs
- [x] Final wiring review: every module imports only what it needs
- [x] `pnpm run build` — no TypeScript errors ✓
- [x] `pnpm run test` — 187 tests passing ✓
- [ ] Full flow test: register → login → browse products → add to cart → checkout → pay → admin marks shipped → SSE event received → emails in Mailhog
  - See `MANUAL_TEST_GUIDE.md` for step-by-step curl commands and checklist

---

## Backlog (post-MVP, before production)

- [ ] JWT token revocation (Redis blocklist + `jti` claim)
- [ ] `passwordChangedAt` invalidation — tokens issued before password change are rejected
- [ ] Email verification on registration
- [ ] `@MaxLength` on all free-text DTO fields
- [ ] Mask email in logs (use `maskEmail()` helper)
- [ ] Pagination on all list endpoints (`PaginationDto`, `PaginatedResponseDto<T>`)
- [ ] Swagger basic-auth gate for staging environment
- [ ] Restrict health check to internal network in production
- [ ] LGPD: review what PII is stored and for how long
