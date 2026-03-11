# Code Style & Conventions

## Language & Formatting
- TypeScript strict mode
- Prettier + ESLint enforced
- File encoding: UTF-8

## Naming Conventions
- Files: `kebab-case.type.ts` (e.g., `pedido.entity.ts`, `pagar-pedido.use-case.ts`)
- Classes: PascalCase
- Variables/methods: camelCase
- Interfaces: PascalCase prefixed with `I` for repositories (e.g., `IPedidoRepository`)
- Enums: PascalCase with UPPER_CASE values
- Repository injection tokens: Symbol (e.g., `export const PEDIDO_REPOSITORY = Symbol('IPedidoRepository')`)

## Domain Layer Rules
- Entities have domain methods (not anemic)
- Repository interfaces have `findByIdOrThrow()` that throws `ResourceNotFoundException`
- Repository interface files also export `assert*Found()` helper functions used by TypeORM implementations
- Typed exceptions: `BusinessException`, `ResourceNotFoundException`, `EntityAlreadyExistsException`
- Value Objects are immutable (Money, Email)

## Application Layer Rules
- Use Cases only — no Service classes coexisting
- Each use case = one class with `executar()` method (Portuguese — confirmed across all modules)
- Split commands vs queries

## Infrastructure Rules
- Manual ack/nack on RabbitMQ consumers
- 3 independent listeners per domain event (email, notification, rabbitmq)

## Portuguese naming
- Domain is in Portuguese (matching the original Java source): `pedido`, `carrinho`, `usuario`, `produto`, etc.
- Use case method is `executar()` not `execute()`

## Module file location
- Feature modules live at `src/*.module.ts` (not in sub-folders): `auth.module.ts`, `categoria.module.ts`, `produto.module.ts`, `estoque.module.ts`, `carrinho.module.ts`
