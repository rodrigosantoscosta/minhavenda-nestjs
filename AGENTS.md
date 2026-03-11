# AGENTS.md — MinhaVenda NestJS Backend

> This file is the first thing any AI agent (or developer) must read before touching this project.
> Read it fully. Do not skip sections.

---

## 1. Project Identity

This is a **port of a Java Spring Boot e-commerce backend** to NestJS.
The source project lives at `E:\code\code2\minhavenda` (Java, do not modify it).
This project lives at `E:\code\minhavenda-nestjs` (NestJS, build here).

The goal is a **faithful port with architectural improvements**. Every feature that exists in the Java project must exist here. See `ARCHITECTURE.md` for the full feature map.

---

## 2. Non-Negotiable Rules

### Rule 1 — Read ARCHITECTURE.md before coding any module
It contains the full folder structure, every module's dependencies, the domain model, DB schema, RabbitMQ topology, and API surface. Do not invent structure — follow what is documented.

### Rule 2 — Never hardcode secrets
No passwords, JWT secrets, or credentials anywhere in source code or with default fallbacks. All secrets come from environment variables. If an env var is missing at startup, throw an error and refuse to start. See `ARCHITECTURE.md § Environment Variables`.

### Rule 3 — All aggregates saved through use cases — never through controllers
Controllers inject use cases. Use cases inject repository interfaces. Use cases are responsible for publishing domain events. Controllers never touch repositories directly.

### Rule 4 — One use case per command, one query class per read
No god services. The pattern is:
```
application/use-cases/{module}/commands/nome-do-comando.use-case.ts
application/use-cases/{module}/queries/nome-da-query.query.ts
```
The execute method is always called `executar()`.

### Rule 5 — Repository interfaces live in the domain layer
Every repository interface is in `src/domain/repositories/`. TypeORM implementations are in `src/infrastructure/persistence/repositories/`. Injection is via Symbol token. Never inject a TypeORM repository class directly into a use case.

### Rule 6 — Domain events must always be published
When a use case saves an aggregate that emitted domain events, it must call `eventEmitter.emitAsync()` for each event before returning. The `cancelarPedido` case in the Java source silently dropped events — do not repeat this mistake.

### Rule 7 — RabbitMQ consumers use manual acknowledgement
Never use `noAck: true`. Every consumer must call `channel.ack(msg)` on success and `channel.nack(msg, false, false)` on failure (sends to DLQ). See `ARCHITECTURE.md § RabbitMQ`.

### Rule 8 — Update NEXT_STEPS.md after completing each step
When you finish a step, mark it `[x]` in `NEXT_STEPS.md` and add a one-line note if something unexpected was discovered. Do not remove steps — the history is useful.

### Rule 9 — TypeScript strict mode, no `any`
The `tsconfig.json` has `"strict": true` and `"module": "commonjs"`. Do not use `any`. If you need an escape hatch, use `unknown` and narrow it. Keep types explicit.

### Rule 10 — Use pnpm, not npm or yarn
Package manager is `pnpm`. All install commands use `pnpm add` / `pnpm add -D`. The lockfile is `pnpm-lock.yaml`.

### Rule 11 — Follow the folder structure exactly
Every file has a designated place. See `ARCHITECTURE.md § Folder Structure`. Do not create ad-hoc files outside the structure.

### Rule 12 — Do not use `class-transformer` `@Exclude` to hide sensitive fields from API responses
Instead, define explicit response DTOs that only include the fields you want. Never return entity objects from controllers.

### Rule 13 — Use `Pedido.criarDoCarrinho()` to create orders — never construct Pedido directly in a use case
The static factory validates the cart, computes all totals, snapshots `ItemPedido` records, and emits `PedidoCriadoEvent`. `FinalizarCheckoutUseCase` calls this factory inside a `DataSource.transaction()`, then publishes events after the transaction commits.

---

## 3. Tech Stack

| Concern | Package | Notes |
|---|---|---|
| Framework | `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | |
| ORM | `@nestjs/typeorm`, `typeorm`, `pg` | TypeORM chosen for 1:1 entity mapping with Java source |
| Auth | `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt` | JWT HS256 |
| Rate limiting | `@nestjs/throttler` | Applied to `/auth/login` and `/auth/register` only |
| RabbitMQ | `@golevelup/nestjs-rabbitmq`, `amqplib` | Manual ack — see Rule 7 |
| Email | `@nestjs-modules/mailer`, `nodemailer` | Plain text templates matching Java source |
| Config | `@nestjs/config`, `joi` | Fail-fast validation at startup |
| Swagger | `@nestjs/swagger`, `swagger-ui-express` | Dev-only, gated by `SWAGGER_ENABLED=true` |
| Validation | `class-validator`, `class-transformer` | Global `ValidationPipe` in `main.ts` |
| Events | `@nestjs/event-emitter` | Domain events → listeners |
| Security headers | `helmet` | Applied in `main.ts` |
| Decimal math | `decimal.js` | Used in `Money` value object |
| SSE | Built-in `Observable` + `Subject` (rxjs) | No extra package |
| Logging | `@nestjs/common` Logger | Structured, no plaintext PII |
| Testing | `jest`, `@nestjs/testing`, `supertest` | |

---

## 4. Project Structure (enforced)

```
E:\code\minhavenda-nestjs\
├── src\
│   ├── domain\
│   │   ├── entities\           ← Pure domain classes (no TypeORM decorators yet)
│   │   ├── enums\              ← StatusPedido, StatusCarrinho, TipoUsuario
│   │   ├── events\             ← PedidoCriadoEvent, PedidoPagoEvent, etc.
│   │   ├── exceptions\         ← BusinessException, ResourceNotFoundException, EntityAlreadyExistsException
│   │   ├── repositories\       ← Interfaces with Symbol tokens: IPedidoRepository, ICarrinhoRepository, etc.
│   │   └── value-objects\      ← Money (Decimal.js), Email
│   │
│   ├── application\
│   │   ├── use-cases\
│   │   │   ├── auth\           ← RegisterUseCase, LoginUseCase
│   │   │   ├── pedido\
│   │   │   │   ├── commands\   ← FinalizarCheckoutUseCase, PagarPedidoUseCase, etc.
│   │   │   │   └── queries\    ← ListarMeusPedidosQuery, BuscarPedidoQuery, etc.
│   │   │   ├── carrinho\commands\ + queries\
│   │   │   ├── produto\commands\ + queries\
│   │   │   ├── categoria\commands\ + queries\
│   │   │   ├── estoque\commands\ + queries\
│   │   │   └── usuario\queries\
│   │   ├── dtos\               ← Request/response DTOs per module
│   │   └── mappers\            ← Static mapper classes (no injection)
│   │
│   ├── infrastructure\
│   │   ├── config\             ← database.config.ts, jwt.config.ts, rabbitmq.config.ts, mail.config.ts
│   │   ├── messaging\
│   │   │   ├── producer\       ← PedidoRabbitMQProducer
│   │   │   ├── consumer\       ← PedidoRabbitMQConsumer (manual ack)
│   │   │   ├── listeners\      ← PedidoEmailListener, PedidoNotificationListener, PedidoRabbitMQBridgeListener
│   │   │   └── dto\            ← PedidoCriadoMessage, PedidoPagoMessage, etc.
│   │   ├── persistence\
│   │   │   └── repositories\   ← TypeORM implementations of domain interfaces
│   │   ├── security\           ← JwtStrategy, JwtAuthGuard, RolesGuard, @Roles() decorator
│   │   └── sse\                ← SseRegistry (Map<string, Subject<MessageEvent>>)
│   │
│   ├── presentation\
│   │   ├── controllers\        ← One controller per module
│   │   └── filters\            ← GlobalExceptionFilter
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test\                       ← e2e tests
├── .env.example                ← Template — never commit .env
├── .env                        ← Gitignored, local secrets
├── docker-compose.yml
├── AGENTS.md                   ← This file
├── NEXT_STEPS.md               ← Build progress tracker
└── ARCHITECTURE.md             ← Full technical reference
```

---

## 5. Module Dependency Order

Build modules in this exact order. Each step depends on the previous ones being complete.

```
1.  Bootstrap + tsconfig + package.json + main.ts + AppModule
2.  ConfigModule (fail-fast env validation)
3.  Domain layer (entities, enums, events, exceptions, repository interfaces, value objects)
4.  TypeORM + migrations (exact schema from Java V1–V10 migrations)
5.  Auth (RegisterUseCase, LoginUseCase, JwtStrategy, JwtAuthGuard, RolesGuard, AuthController)
6.  Categoria (full CRUD)
7.  Produto (full CRUD + filters via FiltrosProduto)
8.  Estoque (add, remove, adjust, consult)
9.  Carrinho (buscar, adicionar item, atualizar quantidade, remover item, limpar)
10. Pedido (FinalizarCheckout via criarDoCarrinho(), PagarPedido, CancelarPedido, ListarMeusPedidos, BuscarPedido)
11. Admin Pedido (EnviarPedido, EntregarPedido, CancelarPedido, ListarTodos, ListarPorStatus)
12. Domain event listeners (Email, Notification, RabbitMQ bridge)
13. RabbitMQ producer + consumer + SSE (PedidoSseController)
14. Admin DLQ (DlqRequeueService, DlqAdminController)
15. GlobalExceptionFilter + Swagger (uncomment scaffold in main.ts) + throttler
```

---

## 6. Key Patterns

### Repository Injection

```typescript
// domain/repositories/ipedido.repository.ts
export const IPEDIDO_REPOSITORY = Symbol('IPedidoRepository');
export interface IPedidoRepository {
  findById(id: string): Promise<Pedido | null>;
  findByIdOrThrow(id: string): Promise<Pedido>;      // throws ResourceNotFoundException
  findByUsuarioId(usuarioId: string): Promise<Pedido[]>;
  findAll(): Promise<Pedido[]>;                      // admin: all orders
  findByStatus(status: StatusPedido): Promise<Pedido[]>; // admin: by status
  save(pedido: Pedido): Promise<Pedido>;
}

// infrastructure/persistence/repositories/pedido.typeorm.repository.ts
@Injectable()
export class PedidoTypeOrmRepository implements IPedidoRepository { ... }

// pedido.module.ts
providers: [
  { provide: IPEDIDO_REPOSITORY, useClass: PedidoTypeOrmRepository },
  FinalizarCheckoutUseCase,
]

// use case
constructor(
  @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
) {}
```

### Produto Filters

```typescript
// domain/repositories/iproduto.repository.ts
export interface FiltrosProduto {
  nome?: string;
  categoriaId?: number;
  precoMin?: number;
  precoMax?: number;
  ativo?: boolean;
}
export interface IProdutoRepository {
  findAll(filtros?: FiltrosProduto): Promise<Produto[]>;
  // ...
}

// TypeORM implementation uses QueryBuilder:
// nome  → WHERE produto.nome ILIKE :nome
// preco → WHERE produto.preco BETWEEN :precoMin AND :precoMax
// ativo → WHERE produto.ativo = :ativo  (default true)
```

### Creating a Pedido (checkout)

```typescript
// CORRECT — use the static factory; never construct Pedido manually in a use case
const pedido = Pedido.criarDoCarrinho({
  usuario,
  itensCarrinho: carrinho.itens,
  enderecoEntrega: dto.enderecoEntrega,
  observacoes: dto.observacoes,
});
// Factory handles: validation, totals, ItemPedido snapshots, PedidoCriadoEvent
await this.pedidoRepo.save(pedido);
for (const event of pedido.consumeEvents()) {
  await this.eventEmitter.emitAsync(event.eventType, event);
}
```

### Domain Events (general pattern)

```typescript
// In entity method — always push to this._events (underscore prefix, transient):
cancelar(motivo: string): void {
  if (this.status !== StatusPedido.CRIADO && this.status !== StatusPedido.PAGO) {
    throw new BusinessException('Apenas pedidos CRIADO ou PAGO podem ser cancelados');
  }
  this.status = StatusPedido.CANCELADO;
  this.dataAtualizacao = new Date();
  this._events.push(new PedidoCanceladoEvent({ pedidoId: this.id, motivo, ... }));
}

// In use case — ALWAYS publish; never skip:
async executar(pedidoId: string, motivo: string): Promise<PedidoDto> {
  const pedido = await this.pedidoRepo.findByIdOrThrow(pedidoId);
  pedido.cancelar(motivo);
  await this.pedidoRepo.save(pedido);
  for (const event of pedido.consumeEvents()) {
    await this.eventEmitter.emitAsync(event.eventType, event);
  }
  return PedidoMapper.toDto(pedido);
}
```

### Error Handling

```typescript
// Always throw typed domain exceptions — never a raw Error
throw new ResourceNotFoundException(`Pedido não encontrado: ${id}`);
throw new EntityAlreadyExistsException(`Email já cadastrado`);
throw new BusinessException(`Carrinho está vazio`);
```

### Controllers

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post('register')
  async registrar(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.register.executar(dto);
  }
}
// No try/catch in controllers — GlobalExceptionFilter handles all exceptions
// No @Transactional in controllers — use cases handle transactions
// No repository calls in controllers — only use case calls
```

---

## 7. Security Checklist (for dev, but still important)

- [ ] `.env` is in `.gitignore` — never commit it
- [ ] JWT secret comes from env — no fallback value, minimum 32 characters
- [ ] `helmet()` is applied in `main.ts`
- [ ] CORS reads `CORS_ALLOWED_ORIGINS` from env — explicit origin list, no wildcard `*`
- [ ] Global `ValidationPipe` registered in `main.ts` with `whitelist: true`
- [ ] Rate limiter on `/auth/login` and `/auth/register` only
- [ ] RabbitMQ consumers use manual ack — never `noAck: true`
- [ ] Admin `cancelarPedido` always publishes domain events
- [ ] No entity objects returned from controllers — explicit DTOs only
- [ ] Swagger only enabled when `SWAGGER_ENABLED=true`

---

## 8. Dev Environment

### Infrastructure (Docker)
```bash
# From E:\code\minhavenda-nestjs
docker compose up -d postgres rabbitmq mailhog

# Services:
# PostgreSQL:          localhost:5432
# RabbitMQ Management: http://localhost:15672  (guest / guest)
# Mailhog UI:          http://localhost:8025
```

### App
```bash
pnpm install
pnpm run start:dev   # hot reload on port 3000; migrations run automatically
pnpm run test        # unit tests
pnpm run test:e2e    # e2e tests
```

### URLs (dev)
| Service | URL |
|---|---|
| API | http://localhost:3000/api |
| Health | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |
| RabbitMQ | http://localhost:15672 |
| Mailhog | http://localhost:8025 |

### Seed credentials
| Role | Email | Password |
|---|---|---|
| ADMIN | admin@minhavenda.com | Admin@123 |
| CLIENTE | cliente@minhavenda.com | Cliente@123 |

---

## 9. Source Project Reference

When in doubt about any feature, read the Java source at `E:\code\code2\minhavenda`.

Key files to check:
- **Domain events**: `src/main/java/.../domain/event/pedido/`
- **Pedido aggregate**: `src/main/java/.../domain/entity/Pedido.java`
- **RabbitMQ config**: `src/main/java/.../infrastructure/config/RabbitMQConfig.java`
- **SSE**: `src/main/java/.../infrastructure/sse/SseEmitterRegistry.java`
- **DB schema**: `src/main/resources/db/migration/V1__create_tables.sql`
- **Migrations V2–V10**: same folder as V1

Do not port bugs. Do not port the god-class `PedidoService`. Do not port the empty `domain/repository/` pattern. See `ARCHITECTURE.md § Improvements Applied` for what is done differently here.
