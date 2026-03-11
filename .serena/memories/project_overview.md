# MinhaVenda NestJS — Project Overview

## Purpose
A REST e-commerce backend (NestJS port of a Java Spring Boot app). Clients browse products, manage carts, place orders. Admins manage products, stock, fulfilment. Every order state change emits domain events that fan out to email (Mailhog dev), in-app notifications, RabbitMQ, and SSE.

## Tech Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: NestJS 11
- **ORM**: TypeORM + PostgreSQL
- **Messaging**: RabbitMQ via `@golevelup/nestjs-rabbitmq`
- **Auth**: JWT HS256 Bearer tokens
- **Email**: Nodemailer → Mailhog (dev)
- **Package manager**: pnpm

## Architecture: Clean Architecture / DDD
```
src/
  domain/           ← Entities, Value Objects, Repo interfaces, Events, Exceptions, Enums
  application/      ← Use Cases, DTOs, Mappers (mostly empty — to be implemented)
  infrastructure/   ← Config, TypeORM repos, RabbitMQ consumer/producer/listeners, Security, SSE
  presentation/     ← Controllers, Exception filters
  migrations/       ← TypeORM migrations (V1–V10)
```

## Key Domain Entities
- Usuario (UUID PK), Categoria (BIGSERIAL), Produto (UUID, Money value object embedded), Estoque (1:1 Produto), Carrinho + ItemCarrinho, Pedido (aggregate root) + ItemPedido, Notificacao

## Status Flows
- Pedido: CRIADO → PAGO → ENVIADO → ENTREGUE | CANCELADO (from CRIADO or PAGO)
- Carrinho: ATIVO → FINALIZADO | ABANDONADO

## API
- Global prefix: `/api`, Port: 3000
- Public: auth (register/login), list products/categories
- Cliente: cart, checkout, orders, profile, SSE stream
- Admin: product/stock/order management, DLQ management

## RabbitMQ
- Exchange: `pedidos.exchange` (topic), events: pedido.criado/pago/enviado/cancelado
- Each queue has a DLQ via `pedidos.dlx`
- Manual ack/nack pattern

## Domain Events Fan-Out (3 independent listeners per event)
1. PedidoEmailListener → Mailhog email
2. PedidoNotificationListener → Notificacao DB record
3. PedidoRabbitMQBridgeListener → RabbitMQ publish
