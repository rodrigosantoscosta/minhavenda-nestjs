# ARCHITECTURE.md — MinhaVenda NestJS Technical Reference

> The complete technical specification for the NestJS port.
> When any detail is ambiguous, the Java source at `E:\code\code2\minhavenda` is the ground truth.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Domain Model](#2-domain-model)
3. [Repository Interfaces](#3-repository-interfaces)
4. [Database Schema](#4-database-schema)
5. [API Surface](#5-api-surface)
6. [RabbitMQ Topology](#6-rabbitmq-topology)
7. [Domain Events](#7-domain-events)
8. [SSE (Server-Sent Events)](#8-sse)
9. [Auth & Security](#9-auth--security)
10. [Email (Mailhog)](#10-email)
11. [Environment Variables](#11-environment-variables)
12. [Bootstrap & Config](#12-bootstrap--config)
13. [Improvements Applied (vs Java source)](#13-improvements-applied)
14. [Known Dev Shortcuts (not bugs)](#14-known-dev-shortcuts)

---

## 1. Overview

MinhaVenda is a REST e-commerce backend. Clients can browse products, manage a cart, and place orders. Admins manage products, stock, and order fulfilment. Every order state change emits a domain event that fans out to: email (Mailhog in dev), in-app notification, RabbitMQ queue, and SSE stream.

**Port:** 3000  
**Global prefix:** `/api`  
**Auth:** JWT HS256, Bearer token  
**ORM:** TypeORM + PostgreSQL  
**Messaging:** RabbitMQ via `@golevelup/nestjs-rabbitmq`  
**Email:** Nodemailer → Mailhog (dev)

---

## 2. Domain Model

### Entities & Key Fields

```
Usuario
  id: UUID (PK)
  nome: string (max 150)
  email: Email (value object, unique)
  senha: string (bcrypt hash)
  tipo: TipoUsuario (ADMIN | CLIENTE)
  ativo: boolean
  dataCadastro: Date

Categoria
  id: number (BIGSERIAL)
  nome: string (unique, max 100)
  descricao: string (max 500)
  ativo: boolean
  dataCadastro: Date

Produto
  id: UUID
  nome: string (max 150)
  descricao: string (TEXT)
  preco: Money { valor: Decimal, moeda: 'BRL' }   ← embedded value object
  urlImagem: string (max 255)
  pesoKg: Decimal
  alturaCm / larguraCm / comprimentoCm: number
  categoria: Categoria (ManyToOne, nullable)
  ativo: boolean
  dataCadastro: Date

Estoque                                             ← 1:1 with Produto
  id: number (BIGSERIAL)
  produto: Produto (OneToOne unique)
  quantidade: number (>= 0)
  atualizadoEm: Date
  — domain methods: adicionar(), remover(), reservar(), ajustar(), temEstoqueSuficiente()

Carrinho
  id: UUID
  usuario: Usuario (ManyToOne)
  status: StatusCarrinho (ATIVO | FINALIZADO | ABANDONADO)
  itens: ItemCarrinho[] (OneToMany, cascade ALL, orphanRemoval)
  valorTotal: Decimal
  quantidadeTotal: number
  dataCriacao / dataAtualizacao: Date
  — domain methods: adicionarItem(), removerItem(), calcularValorTotal(), finalizar()

ItemCarrinho
  id: UUID
  carrinho: Carrinho (ManyToOne)
  produto: Produto (ManyToOne)
  quantidade: number (> 0)
  precoUnitario: Decimal
  subtotal: Decimal (computed by recalcularSubtotal())
  — unique constraint: (carrinho_id, produto_id)
  — domain methods: atualizarQuantidade(), recalcularSubtotal()

Pedido  ← Aggregate Root
  id: UUID
  usuario: Usuario (ManyToOne)
  status: StatusPedido (CRIADO → PAGO → ENVIADO → ENTREGUE | CANCELADO)
  subtotal: Decimal
  valorFrete: Decimal (default 0)
  valorDesconto: Decimal (default 0)
  valorTotal: Decimal
  quantidadeItens: number
  enderecoEntrega: string (max 500)
  observacoes: string (max 1000, nullable)
  codigoRastreio: string (max 100, nullable)
  transportadora: string (max 100, nullable)
  dataCriacao / dataAtualizacao / dataPagamento / dataEnvio / dataEntrega: Date
  emailUsuario / nomeUsuario / telefoneUsuario: string (denormalised — avoids join on event publish)
  _events: BaseDomainEvent[]  (transient — not persisted, underscore prefix)
  — static factory: criarDoCarrinho(params: CriarPedidoParams): Pedido
  — domain methods: marcarComoPago(), marcarComoEnviado(codigoRastreio, transportadora),
                    marcarComoEntregue(), cancelar(motivo), consumeEvents()

ItemPedido
  id: UUID
  pedido: Pedido (ManyToOne)
  produto: Produto (ManyToOne)
  produtoNome: string (snapshot of name at purchase time)
  quantidade: number
  precoUnitario: Decimal
  subtotal: Decimal

Notificacao
  id: number (BIGSERIAL)
  usuario: Usuario (ManyToOne)
  tipo: 'EMAIL' | 'SMS'
  mensagem: string (TEXT)
  enviado: boolean
  enviadoEm: Date (nullable)
```

### Status Flow

```
Pedido:  CRIADO → PAGO → ENVIADO → ENTREGUE
               ↘          ↘
                CANCELADO (from CRIADO or PAGO only)

Carrinho: ATIVO → FINALIZADO (on checkout)
               → ABANDONADO  (future — not yet implemented)
```

### Value Objects

```typescript
// Money — immutable, used as embedded column in Produto
class Money {
  readonly valor: Decimal    // Decimal.js for precision
  readonly moeda: 'BRL'      // always 'BRL'

  static of(valor: number | string | Decimal): Money
  static zero(): Money
  somar(outro: Money): Money
  subtrair(outro: Money): Money   // throws BusinessException if result < 0
  multiplicar(quantidade: number): Money
  maiorQue(outro: Money): boolean
}

// Email — immutable, validates format at construction, stores lowercase
class Email {
  readonly valor: string
  constructor(valor: string)  // throws BusinessException if regex fails
}
```

### Pedido Static Factory

`Pedido.criarDoCarrinho()` is the **only** way to create a new order. Never construct `Pedido` directly in a use case.

```typescript
interface CriarPedidoParams {
  id?: string;               // defaults to randomUUID()
  usuario: Usuario;
  itensCarrinho: ItemCarrinho[];
  enderecoEntrega: string;
  observacoes?: string | null;
  telefoneUsuario?: string;
}

// What the factory does:
// 1. Throws BusinessException if itensCarrinho is empty
// 2. Computes subtotal and quantidadeItens from cart items
// 3. Creates Pedido with status CRIADO, valorFrete/Desconto = 0
// 4. Snapshots each ItemCarrinho → ItemPedido (nome + price at purchase time)
// 5. Pushes PedidoCriadoEvent to _events
```

---

## 3. Repository Interfaces

All interfaces live in `src/domain/repositories/`. Implementations live in `src/infrastructure/persistence/repositories/`. Injection always uses Symbol tokens.

### IUsuarioRepository

```typescript
export const IUSUARIO_REPOSITORY = Symbol('IUsuarioRepository');
export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByIdOrThrow(id: string): Promise<Usuario>;
  findByEmail(email: string): Promise<Usuario | null>;
  existsByEmail(email: string): Promise<boolean>;
  save(usuario: Usuario): Promise<Usuario>;
}
```

### IProdutoRepository

```typescript
export interface FiltrosProduto {
  nome?: string;        // ILIKE search
  categoriaId?: number;
  precoMin?: number;
  precoMax?: number;
  ativo?: boolean;      // defaults to true when omitted
}

export const IPRODUTO_REPOSITORY = Symbol('IProdutoRepository');
export interface IProdutoRepository {
  findById(id: string): Promise<Produto | null>;
  findByIdOrThrow(id: string): Promise<Produto>;
  findAll(filtros?: FiltrosProduto): Promise<Produto[]>;
  save(produto: Produto): Promise<Produto>;
  deleteById(id: string): Promise<void>;
}
```

### ICategoriaRepository

```typescript
export const ICATEGORIA_REPOSITORY = Symbol('ICategoriaRepository');
export interface ICategoriaRepository {
  findById(id: number): Promise<Categoria | null>;
  findByIdOrThrow(id: number): Promise<Categoria>;
  findAll(): Promise<Categoria[]>;
  save(categoria: Categoria): Promise<Categoria>;
  deleteById(id: number): Promise<void>;
}
```

### IEstoqueRepository

```typescript
export const IESTOQUE_REPOSITORY = Symbol('IEstoqueRepository');
export interface IEstoqueRepository {
  findById(id: number): Promise<Estoque | null>;
  findByIdOrThrow(id: number): Promise<Estoque>;
  findByProdutoId(produtoId: string): Promise<Estoque | null>;
  findByProdutoIdOrThrow(produtoId: string): Promise<Estoque>;  // throws ResourceNotFoundException
  save(estoque: Estoque): Promise<Estoque>;
}
```

### ICarrinhoRepository

```typescript
export const ICARRINHO_REPOSITORY = Symbol('ICarrinhoRepository');
export interface ICarrinhoRepository {
  findById(id: string): Promise<Carrinho | null>;
  findByIdOrThrow(id: string): Promise<Carrinho>;
  findAtivoByUsuarioId(usuarioId: string): Promise<Carrinho | null>;
  save(carrinho: Carrinho): Promise<Carrinho>;
}
```

### IPedidoRepository

```typescript
export const IPEDIDO_REPOSITORY = Symbol('IPedidoRepository');
export interface IPedidoRepository {
  findById(id: string): Promise<Pedido | null>;
  findByIdOrThrow(id: string): Promise<Pedido>;
  findByUsuarioId(usuarioId: string): Promise<Pedido[]>;   // client: own orders
  findAll(): Promise<Pedido[]>;                            // admin: all orders
  findByStatus(status: StatusPedido): Promise<Pedido[]>;   // admin: by status
  save(pedido: Pedido): Promise<Pedido>;
}
```

### INotificacaoRepository

```typescript
export const INOTIFICACAO_REPOSITORY = Symbol('INotificacaoRepository');
export interface INotificacaoRepository {
  findById(id: number): Promise<Notificacao | null>;
  findByIdOrThrow(id: number): Promise<Notificacao>;
  save(notificacao: Notificacao): Promise<Notificacao>;
}
```

---

## 4. Database Schema

Migrated from the Java Flyway migrations. All migrations are in `src/migrations/`. Migration path is environment-aware: `src/migrations/*.ts` in dev/test, `dist/migrations/*.js` in prod.

### Tables

| Table | PK | Notes |
|---|---|---|
| `categorias` | BIGSERIAL | |
| `usuarios` | UUID (gen_random_uuid) | email UNIQUE |
| `produtos` | UUID | FK→categorias, ON DELETE SET NULL |
| `estoques` | BIGSERIAL | produto_id UNIQUE, FK→produtos CASCADE |
| `carrinhos` | UUID | FK→usuarios CASCADE |
| `itens_carrinho` | UUID | (carrinho_id, produto_id) UNIQUE |
| `pedidos` | UUID | FK→usuarios RESTRICT |
| `itens_pedido` | UUID | produto_nome is a price/name snapshot |
| `pagamentos` | UUID | FK→pedidos CASCADE — not exposed in API |
| `entregas` | UUID | FK→pedidos CASCADE — not exposed in API |
| `notificacoes` | BIGSERIAL | FK→usuarios CASCADE |
| `eventos_dominio` | UUID | audit log — not directly used |

### Key Indexes (from V2 migration)

```sql
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_carrinhos_usuario ON carrinhos(usuario_id);
CREATE INDEX idx_carrinhos_status ON carrinhos(status);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_itens_pedido_pedido ON itens_pedido(pedido_id);
```

### Seed Data (V3–V5)

- **V3**: 8 seed categories (Eletrônicos, Roupas, Livros, Esportes, Casa, Beleza, Alimentos, Brinquedos)
- **V4**: 2 seed users — `admin@minhavenda.com` (ADMIN) + `cliente@minhavenda.com` (CLIENTE), passwords `Admin@123` and `Cliente@123` bcrypt-hashed
- **V5**: 10 seed products across various categories with stock

---

## 5. API Surface

### Public Endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns `{ status, timestamp }` |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/produtos` | List products (filterable — see query params below) |
| GET | `/api/produtos/:id` | Product detail |
| GET | `/api/categorias` | List categories |
| GET | `/api/categorias/:id` | Category detail |

### Authenticated — Cliente (any logged-in user)

| Method | Path | Description |
|---|---|---|
| GET | `/api/carrinho` | View active cart (auto-creates if none) |
| POST | `/api/carrinho/itens` | Add item to cart |
| PUT | `/api/carrinho/itens/:itemId` | Update item quantity |
| DELETE | `/api/carrinho/itens/:itemId` | Remove item from cart |
| DELETE | `/api/carrinho` | Clear cart |
| POST | `/api/checkout/finalizar` | Convert cart to order |
| GET | `/api/meus-pedidos` | List my orders |
| GET | `/api/pedidos/:id` | Order detail (own orders only) |
| POST | `/api/pedidos/:id/pagar` | Simulate payment |
| POST | `/api/pedidos/:id/cancelar` | Cancel order |
| GET | `/api/pedidos/stream` | SSE stream for real-time updates |
| GET | `/api/perfil` | My profile |
| PUT | `/api/perfil` | Update my profile |
| POST | `/api/auth/alterar-senha` | Change password |

### Authenticated — ADMIN only

| Method | Path | Description |
|---|---|---|
| POST | `/api/produtos` | Create product |
| PUT | `/api/produtos/:id` | Update product |
| DELETE | `/api/produtos/:id` | Delete product |
| GET | `/api/estoque/produto/:id` | Check stock |
| POST | `/api/estoque/produto/:id/adicionar` | Add stock |
| POST | `/api/estoque/produto/:id/remover` | Remove stock |
| PUT | `/api/estoque/produto/:id/ajustar` | Set stock to exact value |
| GET | `/api/admin/pedidos` | All orders |
| GET | `/api/admin/pedidos/status/:status` | Orders by status |
| GET | `/api/admin/pedidos/:id` | Any order by ID |
| POST | `/api/admin/pedidos/:id/pagar` | Mark as paid |
| POST | `/api/admin/pedidos/:id/enviar` | Mark as shipped |
| POST | `/api/admin/pedidos/:id/entregar` | Mark as delivered |
| POST | `/api/admin/pedidos/:id/cancelar` | Cancel any order |
| POST | `/api/admin/pedidos/:id/teste-emails` | Dev: trigger all emails |
| GET | `/api/admin/pedidos/teste-email` | Dev: send test email |
| GET | `/api/admin/dlq/queues` | List DLQ names |
| POST | `/api/admin/dlq/requeue/:queue` | Requeue one DLQ |
| POST | `/api/admin/dlq/requeue-all` | Requeue all DLQs |
| POST | `/api/categorias` | Create category |
| PUT | `/api/categorias/:id` | Update category |
| DELETE | `/api/categorias/:id` | Delete category |

### Query Parameters — GET `/api/produtos`

| Param | Type | Description |
|---|---|---|
| `nome` | string | Partial name search (ILIKE) |
| `categoriaId` | number | Filter by category |
| `precoMin` | number | Minimum price |
| `precoMax` | number | Maximum price |
| `ativo` | boolean | Default: true |

---

## 6. RabbitMQ Topology

```
Exchange: pedidos.exchange (topic, durable)
  │
  ├── routing key: pedido.criado    → queue: pedidos.criado    → DLQ: pedidos.criado.dlq
  ├── routing key: pedido.pago      → queue: pedidos.pago      → DLQ: pedidos.pago.dlq
  ├── routing key: pedido.enviado   → queue: pedidos.enviado   → DLQ: pedidos.enviado.dlq
  └── routing key: pedido.cancelado → queue: pedidos.cancelado → DLQ: pedidos.cancelado.dlq

DLX: pedidos.dlx (direct, durable)
  Dead letter queues: *.dlq
```

### Queue Bindings

Each queue is declared with:
```typescript
{
  durable: true,
  deadLetterExchange: 'pedidos.dlx',
  deadLetterRoutingKey: 'pedidos.<event>.dlq',
}
```

### Consumer Pattern

```typescript
@RabbitSubscribe({
  exchange: 'pedidos.exchange',
  routingKey: 'pedido.criado',
  queue: 'pedidos.criado',
})
async onPedidoCriado(msg: PedidoCriadoMessage, amqpMsg: ConsumeMessage, channel: ConfirmChannel) {
  try {
    await this.sseRegistry.sendEvent(msg.usuarioId, 'pedido.criado', msg);
    channel.ack(amqpMsg);
  } catch (err) {
    this.logger.error('[Consumer] Failed', err);
    channel.nack(amqpMsg, false, false); // → DLQ
  }
}
```

### Message DTOs

```typescript
interface PedidoCriadoMessage {
  eventId: string; pedidoId: string; usuarioId: string;
  emailUsuario: string; nomeUsuario: string;
  valorTotal: number; quantidadeItens: number; occurredOn: string;
}

interface PedidoPagoMessage {
  eventId: string; pedidoId: string; usuarioId: string;
  emailUsuario: string; valorPago: number; metodoPagamento: string;
  occurredOn: string;
}

interface PedidoEnviadoMessage {
  eventId: string; pedidoId: string; usuarioId: string;
  emailUsuario: string; nomeUsuario: string;
  codigoRastreio: string; transportadora: string; telefone: string;
  occurredOn: string;
}

interface PedidoCanceladoMessage {
  eventId: string; pedidoId: string; usuarioId: string;
  emailUsuario: string; motivo: string; occurredOn: string;
}
```

---

## 7. Domain Events

Events are emitted by aggregate methods and stored in `pedido._events` (transient, underscore prefix, not persisted). The use case calls `pedido.consumeEvents()` which returns the list and clears it, then emits each via `EventEmitter2`.

```
PedidoCriadoEvent    → eventType: 'PedidoCriadoEvent'   (emitted by criarDoCarrinho())
PedidoPagoEvent      → eventType: 'PedidoPagoEvent'      (emitted by marcarComoPago())
PedidoEnviadoEvent   → eventType: 'PedidoEnviadoEvent'   (emitted by marcarComoEnviado())
PedidoCanceladoEvent → eventType: 'PedidoCanceladoEvent' (emitted by cancelar())
```

Note: `marcarComoEntregue()` does **not** emit an event — no `PedidoEntregueEvent` exists.

### Listener Fan-Out

Each event is handled by **three independent listeners** (not one monolithic listener):

```
PedidoCriadoEvent
  → PedidoEmailListener.onPedidoCriado()          — sends email via Mailhog
  → PedidoNotificationListener.onPedidoCriado()   — creates Notificacao DB record
  → PedidoRabbitMQBridgeListener.onPedidoCriado() — publishes to RabbitMQ
```

Each listener fails independently. A Mailhog failure does not prevent the RabbitMQ message from being sent.

---

## 8. SSE

**Endpoint:** `GET /api/pedidos/stream` (authenticated)

**Registry:** `SseRegistry` holds a `Map<string, Subject<MessageEvent>>` keyed by `usuarioId`.

**Flow:**
1. Client connects → creates `Subject`, registers in map, returns `Observable` via `@Sse()`
2. RabbitMQ consumer calls `sseRegistry.sendEvent(usuarioId, eventName, data)`
3. Subject emits → client receives in the EventSource

**Timeout:** 5 minutes. After timeout, the Subject is completed and removed from the map.

**Implementation note:** Use `timer(5 * 60 * 1000).pipe(take(1))` merged with the Subject to auto-close.

---

## 9. Auth & Security

### JWT

- Algorithm: HS256
- Payload: `{ sub: usuarioId, email, role: TipoUsuario, jti: randomUUID(), iat, exp }`
- Expiration: from env `JWT_EXPIRATION` (seconds), default 86400 (24h)
- Role is embedded in payload — **no DB hit on every request** (improvement over Java source)

### Guards

```typescript
// Require valid JWT:
@UseGuards(JwtAuthGuard)

// Require ADMIN role:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
```

### Rate Limiting

`@nestjs/throttler` applied to:
- `POST /auth/login` — 10 requests per minute per IP
- `POST /auth/register` — 10 requests per minute per IP

Only trust `X-Forwarded-For` from IP ranges listed in `TRUSTED_PROXY_CIDRS`. Otherwise use `req.socket.remoteAddress`.

### CORS

`CORS_ALLOWED_ORIGINS` is read from env (comma-separated). If empty, CORS is disabled.

```typescript
app.enableCors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 3600,
});
```

### Helmet

Applied in `main.ts` before CORS and routes:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Password

- Hashing: bcrypt, 12 salt rounds
- Min length: 8 chars, max 72 chars (bcrypt truncates at 72 bytes)
- DTO validators: `@MinLength(8)`, `@MaxLength(72)`

---

## 10. Email

In dev, all emails go to **Mailhog** (`localhost:1025` SMTP, `http://localhost:8025` UI).

### Templates (plain text, matching Java source)

| Trigger | Subject |
|---|---|
| Pedido criado | `✅ Pedido #<8chars> criado com sucesso!` |
| Pedido pago | `💳 Pagamento confirmado - Pedido #<8chars>` |
| Pedido enviado | `🚚 Pedido enviado - #<8chars>` |
| Pedido cancelado | `❌ Pedido cancelado - #<8chars>` |

The `#<8chars>` is the first 8 characters of the UUID (matching Java behaviour).

---

## 11. Environment Variables

All vars are required. The app refuses to start if any are missing (Joi fail-fast).

```dotenv
# Application
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=minhavenda
DB_PASSWORD=          # Required — no default
DB_NAME=minhavenda

# JWT
JWT_SECRET=           # Required — min 32 chars — generate: openssl rand -base64 64
JWT_EXPIRATION=86400  # seconds

# RabbitMQ
RABBITMQ_URL=amqp://minhavenda:minhavenda@localhost:5672

# Mail (Mailhog in dev)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@minhavenda.com.br
MAIL_FROM_NAME=MinhaVenda

# CORS (comma-separated list of allowed origins)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Swagger (set to 'true' in dev only — never in production)
SWAGGER_ENABLED=true

# Trusted proxy CIDRs for rate limiter X-Forwarded-For (comma-separated, empty = none)
TRUSTED_PROXY_CIDRS=
```

---

## 12. Bootstrap & Config

### tsconfig.json

Must use `"module": "commonjs"` — `"nodenext"` breaks NestJS decorator metadata (`reflect-metadata`), TypeORM entity decorators, and `ts-jest`. Path aliases are configured:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@app/*":    ["src/application/*"],
      "@infra/*":  ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"]
    }
  }
}
```

### main.ts

Order of operations matters:

```typescript
app.use(helmet());          // security headers first
app.setGlobalPrefix('api');
app.enableCors({ ... });    // explicit origin list from env
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
// Swagger — only if SWAGGER_ENABLED=true (uncomment scaffold in main.ts)
await app.listen(process.env.PORT ?? 3000);
```

### package.json — runtime dependencies that must be present

| Package | Reason |
|---|---|
| `helmet` | Used in `main.ts` — must be in `dependencies` not `devDependencies` |
| `class-validator` | Used by `ValidationPipe` for DTO decorators |
| `class-transformer` | Used by `ValidationPipe` transform option |
| `decimal.js` | Used by `Money` value object |

---

## 13. Improvements Applied (vs Java source)

These are the architectural fixes applied from the start — not as a refactor.

### Applied in Domain Layer

| Issue | Fix |
|---|---|
| Empty `domain/repository/` | All 7 repository interfaces defined with Symbol tokens |
| `RuntimeException` everywhere | Typed exceptions: `BusinessException`, `ResourceNotFoundException`, `EntityAlreadyExistsException` |
| No `findByIdOrThrow()` | Every repository has `findByIdOrThrow()` throwing `ResourceNotFoundException` |
| No Pedido factory — Pedido constructed inline | `Pedido.criarDoCarrinho()` static factory handles validation, totals, item snapshots, and event emission |

### Applied in Application Layer

| Issue | Fix |
|---|---|
| `PedidoService` god class | Split into commands (FinalizarCheckout, PagarPedido, CancelarPedido, EnviarPedido, EntregarPedido) + queries |
| `UseCase` + `Service` coexistence | Use cases only — no PedidoService |
| `buscarCarrinho` writes secretly | Split into `VisualizarCarrinhoQuery` (read-only) + `ObterOuCriarCarrinhoUseCase` |
| Carrinho bypasses aggregate | `adicionarItem()` on aggregate + one `save()` with cascade |
| Stock modified outside aggregate | `Estoque` as its own root with `ReservarEstoqueUseCase` |

### Applied in Infrastructure Layer

| Issue | Fix |
|---|---|
| Monolithic `PedidoEventListener` | Split into Email, Notification, RabbitMQBridge listeners |
| `auto-ack` on consumers | Manual `channel.ack()` / `channel.nack()` |
| Admin `cancelarPedido` drops events | Goes through `CancelarPedidoAdminUseCase` — events always published |
| JWT has no role claim → DB hit per request | Role embedded in JWT payload at sign time |
| Hardcoded JWT secret | Fail-fast Joi validation — no fallback values |

### Applied in Security

| Issue | Fix |
|---|---|
| Wildcard CORS `*` + credentials | Explicit origin list from env, explicit header whitelist |
| No Helmet | Applied in `main.ts` |
| No input validation | Global `ValidationPipe` with `whitelist + forbidNonWhitelisted` |
| Rate limiter trusts `X-Forwarded-For` blindly | Safe IP extraction with trusted proxy CIDR check |
| Swagger exposed publicly | Gated by `SWAGGER_ENABLED=true` env var |
| DB/RabbitMQ fallback credentials | Fail-fast — all secrets required |
| Weak password policy (6 chars) | Min 8 chars, max 72 chars |

---

## 14. Known Dev Shortcuts (not bugs)

These are intentional dev-mode behaviours. **Do not fix them** — they are documented to avoid confusion.

| Shortcut | Location | Production equivalent |
|---|---|---|
| Payment is simulated (`POST /pedidos/:id/pagar`) | `PagarPedidoUseCase` | Payment gateway (Stripe, Pagar.me) |
| Emails go to Mailhog | `MAIL_HOST=localhost` | Real SMTP (SendGrid, SES) |
| RabbitMQ uses local Docker | `RABBITMQ_URL=amqp://localhost` | CloudAMQP or managed RabbitMQ |
| No email verification on register | `RegisterUseCase` | See backlog in `NEXT_STEPS.md` |
| No token revocation | `JwtStrategy` | Redis blocklist + `jti` claim |
| Swagger always on in dev | `SWAGGER_ENABLED=true` | Set to `false` in production |
| Health endpoint is public | `GET /api/health` | Lock to internal network |
| SSE has no heartbeat | `SseRegistry` | Add `interval(30000)` keepalive ping |
