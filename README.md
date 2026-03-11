# MinhaVenda NestJS

A REST e-commerce backend built with NestJS — a port of the original Java Spring Boot project. Clients browse products, manage their cart, and place orders. Admins manage the catalogue, stock levels, and the full order lifecycle. Every order status change emits domain events that fan out independently to email (Mailhog in dev), in-app notifications, RabbitMQ, and a real-time SSE stream delivered to the client.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 + TypeScript 5 |
| Framework | NestJS 11 |
| ORM | TypeORM 0.3 + PostgreSQL 16 |
| Messaging | RabbitMQ 4 via `@golevelup/nestjs-rabbitmq` |
| Authentication | JWT HS256 Bearer (Passport) |
| Email (dev) | Nodemailer → Mailhog |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI at `/api/docs` |
| Package manager | pnpm |

---

## Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker + Docker Compose

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in at least the following:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=minhavenda
DB_PASSWORD=minhavenda
DB_NAME=minhavenda

JWT_SECRET=<random string, minimum 32 characters>

RABBITMQ_URL=amqp://minhavenda:minhavenda@localhost:5672

SWAGGER_ENABLED=true
```

### 3. Start infrastructure

```bash
docker compose up -d postgres rabbitmq mailhog
```

| Service | Address |
|---|---|
| PostgreSQL | `localhost:5433` |
| RabbitMQ Management UI | http://localhost:15672 — user: `minhavenda` / password: `minhavenda` |
| Mailhog (dev email) | http://localhost:8025 |

---

## Running the app

```bash
# Development (watch mode)
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

The API is available at **http://localhost:3000/api**

Swagger docs are available at **http://localhost:3000/api/docs** (when `SWAGGER_ENABLED=true`)

---

## Migrations

Migrations run automatically on startup (`migrationsRun: true`). To run them manually:

```bash
pnpm run typeorm migration:run
```

The migration path is resolved per environment — `src/migrations/*.ts` in development and test, and `dist/migrations/*.js` in production.

### Seed data

| Migration | Contents |
|---|---|
| V3 | Base categories |
| V4 | Admin user + sample clients |
| V5–V9 | Products with image URLs |

**Seed admin credentials:**

```
email: admin@loja.com
password: 123456
```

> Seed passwords use bcrypt with **10 rounds**. New users registered via the API are hashed with **12 rounds**.

---

## Tests

```bash
# Run all unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:cov
```

**187 tests** across 25 suites, covering all use case and domain entity layers.

---

## Project structure

```
src/
├── domain/                   # Entities, Value Objects, repo interfaces, events, exceptions, enums
│   ├── entities/
│   ├── value-objects/        # Money (Decimal.js), Email
│   ├── events/               # PedidoCriado/Pago/Enviado/Cancelado
│   ├── repositories/         # Interfaces + injection tokens
│   ├── enums/
│   └── exceptions/
│
├── application/              # Use cases, DTOs, Mappers
│   ├── use-cases/
│   │   ├── auth/
│   │   ├── categoria/
│   │   ├── produto/
│   │   ├── estoque/
│   │   ├── carrinho/
│   │   └── pedido/
│   ├── dtos/
│   └── mappers/
│
├── infrastructure/           # Concrete implementations
│   ├── config/               # Env validation (Joi), per-module configs
│   ├── persistence/
│   │   └── repositories/     # TypeORM implementations
│   ├── security/             # JwtStrategy, Guards, Decorators
│   ├── messaging/
│   │   ├── listeners/        # @OnEvent listeners (email, notification, RabbitMQ)
│   │   ├── producer/         # PedidoRabbitMQProducer
│   │   ├── consumer/         # PedidoRabbitMQConsumer (nack → DLQ)
│   │   └── dlq-requeue.service.ts
│   └── sse/                  # SseRegistry (Map<userId, Subject>)
│
├── presentation/             # Controllers + Global Exception Filter
│   └── controllers/
│
└── migrations/               # V1–V10 TypeORM migrations
```

---

## API Reference

Global prefix: `/api` | Port: `3000`

### Authentication

| Method | Route | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/alterar-senha` | Authenticated |

### Categories

| Method | Route | Access |
|---|---|---|
| GET | `/categorias` | Public |
| GET | `/categorias/:id` | Public |
| POST | `/categorias` | Admin |
| PUT | `/categorias/:id` | Admin |
| DELETE | `/categorias/:id` | Admin |

### Products

| Method | Route | Access |
|---|---|---|
| GET | `/produtos` | Public — filters: `nome`, `categoriaId`, `precoMin`, `precoMax`, `ativo` |
| GET | `/produtos/:id` | Public |
| POST | `/produtos` | Admin |
| PUT | `/produtos/:id` | Admin |
| DELETE | `/produtos/:id` | Admin |

### Cart

| Method | Route | Access |
|---|---|---|
| GET | `/carrinho` | Client |
| POST | `/carrinho/itens` | Client |
| PUT | `/carrinho/itens/:itemId` | Client |
| DELETE | `/carrinho/itens/:itemId` | Client |
| DELETE | `/carrinho` | Client |

### Orders — Client

| Method | Route | Access |
|---|---|---|
| POST | `/checkout/finalizar` | Client |
| GET | `/meus-pedidos` | Client |
| GET | `/pedidos/:id` | Client |
| POST | `/pedidos/:id/pagar` | Client |
| POST | `/pedidos/:id/cancelar` | Client |
| GET | `/pedidos/stream` | Client — SSE |

### Orders — Admin

| Method | Route | Access |
|---|---|---|
| GET | `/admin/pedidos` | Admin |
| GET | `/admin/pedidos/status/:status` | Admin |
| GET | `/admin/pedidos/:id` | Admin |
| POST | `/admin/pedidos/:id/pagar` | Admin |
| POST | `/admin/pedidos/:id/enviar` | Admin |
| POST | `/admin/pedidos/:id/entregar` | Admin |
| POST | `/admin/pedidos/:id/cancelar` | Admin |

### Stock — Admin

| Method | Route | Access |
|---|---|---|
| GET | `/estoque/produto/:produtoId` | Admin |
| POST | `/estoque/produto/:produtoId/adicionar` | Admin |
| POST | `/estoque/produto/:produtoId/remover` | Admin |
| PUT | `/estoque/produto/:produtoId/ajustar` | Admin |

### Dead Letter Queue — Admin

| Method | Route | Access |
|---|---|---|
| GET | `/admin/dlq/queues` | Admin |
| POST | `/admin/dlq/requeue/:queue` | Admin |
| POST | `/admin/dlq/requeue-all` | Admin |

---

## Order status flow

```
CRIADO ──▶ PAGO ──▶ ENVIADO ──▶ ENTREGUE
   │          │
   └──────────┴──▶ CANCELADO
```

Each transition emits a domain event that triggers **three independent async listeners**:

1. **PedidoEmailListener** — sends a plain-text email via Mailhog (dev)
2. **PedidoNotificationListener** — persists a record to the `notificacoes` table
3. **PedidoRabbitMQBridgeListener** — publishes the event to `pedidos.exchange`

Messages consumed from RabbitMQ are also pushed to the connected client in real time via SSE (`GET /pedidos/stream`).

---

## RabbitMQ topology

The project uses a topic exchange (`pedidos.exchange`) with four business queues — one per order event type — each backed by a dedicated DLQ. Messages that fail processing are nacked without requeue and routed to their DLQ via the dead letter exchange (`pedidos.dlx`). The application starts normally even if RabbitMQ is unavailable (`connectionInitOptions: { wait: false }`).

| Routing key | Queue | DLQ |
|---|---|---|
| `pedido.criado` | `pedido.criado` | `pedido.criado.dlq` |
| `pedido.pago` | `pedido.pago` | `pedido.pago.dlq` |
| `pedido.enviado` | `pedido.enviado` | `pedido.enviado.dlq` |
| `pedido.cancelado` | `pedido.cancelado` | `pedido.cancelado.dlq` |

---

## DBeaver connection (dev)

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `minhavenda` |
| Username | `minhavenda` |
| Password | `minhavenda` |

> Port 5433 rather than the default 5432 — the docker-compose maps `5433 → 5432` on the container to avoid conflicts with a local Postgres installation.

---

## Manual testing (Insomnia)

Import `minhavenda-insomnia.json` from the repository root into Insomnia via **Application → Import → From File**.

The collection is organised into folders mirroring the API sections above. After importing, fill in the environment variables — the most important ones to set after your first login calls are `token_cliente`, `token_admin`, `produto_id`, and `pedido_id`.

---

## Architecture decisions

The project follows **Clean Architecture with DDD** principles. The domain layer is pure TypeScript with no framework dependencies — use cases in the application layer orchestrate entities and repositories through interfaces, with no direct awareness of TypeORM.

**Value Objects** — `Money` wraps `Decimal.js` for monetary precision and `Email` enforces format validation at construction time. Both are immutable. All TypeORM `ValueTransformer` implementations guard against `null`/`undefined` during JOIN hydration, preventing the class of runtime errors that arise when TypeORM partially hydrates a related entity.

**Aggregate Root** — `Pedido` is the aggregate root that controls all status transitions and accumulates domain events in a private `_events[]` array. Events are consumed and published by the application layer after the entity is persisted, keeping side effects outside the transaction boundary.

**Transactional checkout** — `FinalizarCheckoutUseCase` uses `DataSource.transaction()` to atomically reserve stock, finalise the cart, and persist the new order. If any step fails, the entire operation rolls back.

**Ownership security** — client-facing use cases load orders by both `id` and `usuarioId`, returning 404 rather than 403 when the record belongs to another user. This avoids leaking the existence of other users' orders.

---

## Backlog (post-MVP)

- JWT token revocation via Redis blocklist using the `jti` claim
- `passwordChangedAt` field to invalidate tokens issued before a password change
- Email verification on registration
- Pagination on all list endpoints (`PaginationDto` / `PaginatedResponseDto<T>`)
- Email masking in logs
- Swagger basic-auth gate for staging environments
- Health check restricted to internal network in production
- LGPD review — audit what PII is stored and define retention periods
