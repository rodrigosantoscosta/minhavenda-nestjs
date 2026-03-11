# Suggested Commands — minhavenda-nestjs (Windows)

## Development
```
pnpm start:dev       # Start with watch mode
pnpm start:debug     # Start with debugger
pnpm start           # Start once
```

## Build & Production
```
pnpm build           # Compile TypeScript
pnpm start:prod      # Run compiled output
```

## Testing
```
pnpm test            # Run all unit tests
pnpm test:watch      # Watch mode
pnpm test:cov        # With coverage
pnpm test:e2e        # End-to-end tests
```

## Linting & Formatting
```
pnpm lint            # ESLint --fix
pnpm format          # Prettier --write
```

## TypeORM CLI
```
pnpm typeorm migration:run    # Run pending migrations
pnpm typeorm migration:revert # Revert last migration
```

## Windows Utilities
- `dir` instead of `ls`
- `type` instead of `cat`
- `where` instead of `which`
- `git` works normally
- `grep` → use `findstr` or install git-bash/ripgrep
