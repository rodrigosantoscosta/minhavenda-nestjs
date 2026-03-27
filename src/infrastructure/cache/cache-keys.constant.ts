export const CACHE_PREFIXES = {
  PRODUTOS_LISTA: 'produtos:lista:',
  REFRESH_TOKENS_BY_USER: (userId: string) => `auth:refresh:user:${userId}:`,
} as const;

export const CACHE_KEYS = {
  CATEGORIAS_ALL: 'categorias:all',
  CATEGORIA_BY_ID: (id: number) => `categorias:${id}`,
  PRODUTO_BY_ID: (id: string) => `produtos:${id}`,
  PRODUTOS_LISTA: (filtros: string) => `${CACHE_PREFIXES.PRODUTOS_LISTA}${filtros}`,
  DASHBOARD_STATS: 'admin:dashboard:stats',
  REFRESH_TOKEN: (jti: string) => `auth:refresh:${jti}`,
  REFRESH_TOKEN_BY_USER: (userId: string, jti: string) =>
    `auth:refresh:user:${userId}:${jti}`,
} as const;

/** TTLs em segundos */
export const CACHE_TTL = {
  CATEGORIAS: 600,
  PRODUTOS: 300,
  DASHBOARD: 60,
} as const;