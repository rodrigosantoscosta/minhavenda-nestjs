# Corrections Applied (Steps 1-4 review)

## Date: initial review pass

### 1. tsconfig.json — module changed from "nodenext" to "commonjs"
`resolvePackageJsonExports` and `moduleResolution: "nodenext"` removed.
NestJS, TypeORM decorators, reflect-metadata, ts-jest all require CommonJS.

### 2. main.ts — CORS fixed
`app.enableCors()` with no args defaulted to wildcard `*`.
Now reads `CORS_ALLOWED_ORIGINS` env var (comma-separated), explicit method + header whitelist.

### 3. main.ts — Global ValidationPipe added
`new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`

### 4. main.ts — Conditional Swagger scaffold added
Code is commented-out pending `pnpm add @nestjs/swagger swagger-ui-express`.
Uncomment when packages are installed in Step 15.

### 5. package.json — Missing runtime deps added
- `helmet`, `class-validator`, `class-transformer`
- Also added in Step 5: `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `bcrypt`, `passport`, `passport-jwt`

### 6. IProdutoRepository — FiltrosProduto interface + findAll(filtros?)
`FiltrosProduto = { nome?, categoriaId?, precoMin?, precoMax?, ativo? }`.

### 7. IPedidoRepository — Added admin methods
`findAll()` and `findByStatus(status)`.

### 8. IEstoqueRepository — Added findByProdutoIdOrThrow
`findByProdutoIdOrThrow(produtoId: string): Promise<Estoque>`.

### 9. Pedido entity — Added static criarDoCarrinho() factory
Renamed `events` → `_events`. Added CriarPedidoParams. Factory emits PedidoCriadoEvent.

### 10. app.module.ts — Migrations path is now environment-aware
`src/migrations/*.ts` in dev/test, `dist/migrations/*.js` in prod.

### 11. AppController/AppService — Health endpoint
`GET /api/health` → `{ status: 'ok', timestamp: ISO-8601 }`

## Current Status
- [x] Steps 1–4 complete (Bootstrap, Config, Domain, TypeORM+Migrations)
- [x] Step 5 complete (Auth: JWT, guards, register/login/alterar-senha use cases, AuthModule)
- [x] Step 6 complete (Categoria: full CRUD, CategoriaModule wired into AppModule)
  - All files already scaffolded; 20 unit tests added across 5 use cases
  - Duplicate-name check in Criar/Atualizar does in-memory scan (no findByNome). Fine for MVP.
- [x] Step 7 complete (Produto Module)
  - All files already scaffolded. 3 missing spec files written.
  - Specs: excluir (3), listar (5), buscar (4) = 12 tests total
  - criar (7) and atualizar (7) specs were already present = grand total 26 tests for Step 7
  - ProdutoTypeOrmRepository.findAll uses QueryBuilder with ILIKE, precio range, categoria FK, ativo default=true
  - ProdutoModule imports CategoriaModule to inject ICATEGORIA_REPOSITORY into use cases
- [ ] Step 8 next (Estoque Module) ← CURRENT
