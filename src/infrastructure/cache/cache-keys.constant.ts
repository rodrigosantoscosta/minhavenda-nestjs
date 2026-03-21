export const CACHE_KEYS = {
  CATEGORIAS_ALL: 'categorias:all',
  CATEGORIA_BY_ID: (id: number) => `categorias:${id}`,
  PRODUTO_BY_ID: (id: string) => `produtos:${id}`,
  PRODUTOS_LISTA: (filtros: string) => `produtos:lista:${filtros}`,
  DASHBOARD_STATS: 'admin:dashboard:stats',
} as const;

/** TTLs em segundos */
export const CACHE_TTL = {
  CATEGORIAS: 600,   // 10 min — dados estáveis
  PRODUTOS: 300,     // 5 min
  DASHBOARD: 60,     // 1 min — dados dinâmicos
} as const;
